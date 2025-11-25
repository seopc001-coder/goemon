// ===================================
// 五右衛門 ECサイト - ポイント管理データベース操作
// ===================================

// ===================================
// ポイント取得
// ===================================

/**
 * ユーザーの現在のポイント残高を取得
 */
async function fetchUserPoints(userId) {
    try {
        const { data, error } = await supabase
            .from('user_profiles')
            .select('points')
            .eq('id', userId)
            .single();

        if (error) throw error;
        return data?.points || 0;
    } catch (error) {
        console.error('ポイント残高取得エラー:', error);
        return 0;
    }
}

/**
 * ユーザーのポイント履歴を取得
 */
async function fetchPointHistory(userId, limit = 50) {
    try {
        const { data, error } = await supabase
            .from('point_history')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('ポイント履歴取得エラー:', error);
        return [];
    }
}

// ===================================
// ポイント更新
// ===================================

/**
 * ポイントを付与
 */
async function addPoints(userId, points, reason, orderId = null) {
    try {
        // 現在のポイント残高を取得
        const currentPoints = await fetchUserPoints(userId);
        const newPoints = currentPoints + points;

        // ポイント残高を更新
        const { error: updateError } = await supabase
            .from('user_profiles')
            .update({ points: newPoints })
            .eq('id', userId);

        if (updateError) throw updateError;

        // ポイント履歴を記録
        const { error: historyError } = await supabase
            .from('point_history')
            .insert([{
                user_id: userId,
                points: points,
                balance_after: newPoints,
                type: 'earn',
                reason: reason,
                order_id: orderId
            }]);

        if (historyError) throw historyError;

        console.log(`✅ ポイント付与成功: ユーザー ${userId} に ${points}pt 付与 (残高: ${newPoints}pt)`);
        return newPoints;
    } catch (error) {
        console.error('ポイント付与エラー:', error);
        throw error;
    }
}

/**
 * ポイントを使用
 */
async function usePoints(userId, points, reason, orderId = null) {
    try {
        // 現在のポイント残高を取得
        const currentPoints = await fetchUserPoints(userId);

        // 残高不足チェック
        if (currentPoints < points) {
            throw new Error(`ポイント残高不足 (現在: ${currentPoints}pt, 必要: ${points}pt)`);
        }

        const newPoints = currentPoints - points;

        // ポイント残高を更新
        const { error: updateError } = await supabase
            .from('user_profiles')
            .update({ points: newPoints })
            .eq('id', userId);

        if (updateError) throw updateError;

        // ポイント履歴を記録
        const { error: historyError } = await supabase
            .from('point_history')
            .insert([{
                user_id: userId,
                points: -points,
                balance_after: newPoints,
                type: 'use',
                reason: reason,
                order_id: orderId
            }]);

        if (historyError) throw historyError;

        console.log(`✅ ポイント使用成功: ユーザー ${userId} が ${points}pt 使用 (残高: ${newPoints}pt)`);
        return newPoints;
    } catch (error) {
        console.error('ポイント使用エラー:', error);
        throw error;
    }
}

/**
 * 購入金額に応じてポイントを付与
 * @param {string} userId - ユーザーID
 * @param {number} amount - 購入金額（送料別）
 * @param {string} orderId - 注文ID
 * @returns {Promise<number>} 付与されたポイント数
 */
async function awardPurchasePoints(userId, amount, orderId) {
    try {
        // サイト設定からポイント付与レートを取得（デフォルト: 500円 = 1pt）
        let pointRate = 500;
        try {
            const rateSetting = await fetchSiteSetting('point_award_rate');
            if (rateSetting && rateSetting.value) {
                pointRate = parseInt(rateSetting.value);
            }
        } catch (settingError) {
            console.warn('ポイント付与レート取得エラー。デフォルト値(500)を使用:', settingError);
        }

        // 設定されたレートに応じてポイント付与
        const pointsToAward = Math.floor(amount / pointRate);

        if (pointsToAward <= 0) {
            console.log(`ポイント付与なし（購入金額が${pointRate}円未満）`);
            return 0;
        }

        const reason = `注文 #${orderId} によるポイント付与 (¥${amount.toLocaleString()})`;
        await addPoints(userId, pointsToAward, reason, orderId);

        console.log(`ポイント付与: ${pointsToAward}pt (購入金額: ¥${amount.toLocaleString()}, レート: ${pointRate}円/pt)`);
        return pointsToAward;
    } catch (error) {
        console.error('購入ポイント付与エラー:', error);
        throw error;
    }
}

// ===================================
// 管理者用ポイント操作
// ===================================

/**
 * 全ユーザーのポイント情報を取得（管理者用）
 */
async function fetchAllUserPoints() {
    try {
        const { data, error } = await supabase
            .from('user_profiles')
            .select('id, email, display_name, family_name, given_name, points')
            .order('points', { ascending: false });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('全ユーザーポイント取得エラー:', error);
        return [];
    }
}

/**
 * 管理者がポイントを手動付与
 */
async function adminAddPoints(userId, points, reason) {
    try {
        await addPoints(userId, points, `[管理者操作] ${reason}`, null);
        return true;
    } catch (error) {
        console.error('管理者ポイント付与エラー:', error);
        throw error;
    }
}

/**
 * 管理者がポイントを手動減算
 */
async function adminDeductPoints(userId, points, reason) {
    try {
        await usePoints(userId, points, `[管理者操作] ${reason}`, null);
        return true;
    } catch (error) {
        console.error('管理者ポイント減算エラー:', error);
        throw error;
    }
}

// ===================================
// ポイント履歴のフォーマット
// ===================================

/**
 * ポイント履歴を表示用にフォーマット
 */
function formatPointHistory(history) {
    return history.map(item => ({
        id: item.id,
        date: new Date(item.created_at).toLocaleDateString('ja-JP'),
        time: new Date(item.created_at).toLocaleTimeString('ja-JP'),
        type: item.type === 'earn' ? '獲得' : '使用',
        points: item.points,
        balanceAfter: item.balance_after,
        reason: item.reason,
        orderId: item.order_id,
        isPositive: item.type === 'earn'
    }));
}
