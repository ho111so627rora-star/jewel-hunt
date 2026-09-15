# GitHub Pages + Supabase 公開

画面はGitHub Pages、対戦処理はSupabase Edge Functionsで動作します。ローカルの npm run dev は従来のファイル保存を使用します。

対象プロジェクト: osezluokvznxmsjrajbd

1. Supabase CLIでログインします。
2. SQL Editorで supabase/migrations/20260911000000_jewel_rooms.sql を実行します。テーブルは匿名ユーザーから読み書きできません。
3. npm run build:functions を実行します。
4. npx supabase functions deploy jewel-rooms --project-ref osezluokvznxmsjrajbd を実行します。認証はゲーム固有のプレイヤートークンで行うため、config.toml の verify_jwt=false を使用します。
5. GitHubリポジトリのActions変数 SUPABASE_PROJECT_URL に https://osezluokvznxmsjrajbd.supabase.co を登録します。秘密キーは登録不要です。
6. Settings > Pages の Source を GitHub Actions に設定し、Publish GitHub Pages ワークフローを実行します。

公開予定URL: https://ho111so627rora-star.github.io/phantom-gem/

Supabase URL未設定時は公開ワークフローをスキップします。バックエンドを配置してから変数を設定してください。

ローカルで静的ビルドする場合は NEXT_PUBLIC_SUPABASE_URL と NEXT_PUBLIC_BASE_PATH=/phantom-gem を設定して npm run build:pages を実行します。出力は .pages-build/out です。

接続元は https://ho111so627rora-star.github.io に限定しています。追加する場合はSupabaseの JEWEL_ALLOWED_ORIGINS シークレットにカンマ区切りで設定します。

無料枠の利用量・休止条件はSupabaseのダッシュボードで確認してください。現時点では古いルームの自動削除はありません。

