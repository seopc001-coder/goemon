// ===================================
// Supabase 設定
// ===================================

const SUPABASE_URL = 'https://xckbptiskukcwcgwvdhn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhja2JwdGlza3VrY3djZ3d2ZGhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0NjAxNjYsImV4cCI6MjA3OTAzNjE2Nn0.QCxt1Urxv9Xv5reDiMTeFsqEdHYm7kWiLuHAXM5jN2k';

// Supabaseクライアントの初期化
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
