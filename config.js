// Supabase Configuration
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://beynxlogttkrrkejvftz.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJleW54bG9ndHRrcnJrZWp2ZnR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0ODk5MDcsImV4cCI6MjA3MzA2NTkwN30.04vv-EjQd92MtrprRAtpeEtEYQRjizMmC8I9e885miE';

module.exports = {
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development'
};
