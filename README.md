⸻

メモアプリ 要件定義書（v0.1）

0. 前提
	•	開発対象：個人用MVP（将来シェア拡張可能）
	•	技術スタック：Next.js (App Router) + TypeScript + TailwindCSS + shadcn/ui
	•	保存先：LocalStorage（将来Supabaseへ移行可能）
	•	認証：なし（Supabase導入時にGoogle Authを追加予定）
	•	PWA対応（スマホ利用前提、オフラインでも利用可能）
	•	デザイン：黒ベース（ターミナル風）、アクセントはエメラルド（将来変更可）

⸻

1. ゴール
	•	思いつきを摩擦なく記録できる
	•	記録した内容をタグや時系列で振り返りやすい
	•	保存体験が心地よく「書きたくなる」仕掛けを持つ

⸻

2. 機能要件

2.1 入力
	•	アプリ起動時に入力欄へ自動フォーカス
	•	テキストを入力し、Enterキーで保存＆入力欄リセット
	•	Enterキーで保存後、次のInput欄に自動でフォーカス移動
	•	保存時に軽いアニメーション＋バイブレーション
	•	直近追加した3件を画面上に表示（思考の積み重ねを可視化）
	•	FAB（＋）ボタンで入力欄へ即フォーカス

2.2 タグ付け
	•	保存後、4種のタグチップを表示
	•	ToDo / アイデア / メモ / その他
	•	複数タグ付与可能
	•	タグ付けは保存後すぐに選択可能

2.3 閲覧ビュー
	•	下タブ切替
	•	記入ビュー（入力中心＋直近ログ）
	•	タグ別ビュー（タグフィルタ、統計表示）
	•	時系列ビュー（日付ごとにグルーピング）

タグ別ビュー
	•	チップで複数フィルタ可能
	•	ToDoはチェックボックスで完了/未完了を即トグル
	•	タグごとの件数を表示（例：ToDo:5件、アイデア:12件）

時系列ビュー
	•	Today / Yesterday / This Week / Older に自動で分割
	•	ULIDによる時系列ソート

2.4 検索
	•	Cmd/Ctrl + K で検索パレット表示
	•	内容テキストを対象に全文検索

2.5 統計・カウンター
	•	画面端に「今日の入力件数」を表示
	•	タグごとの集計をタグ別ビューで表示

2.6 データ管理
	•	LocalStorageに保存（キー：memo.v1.items）
	•	JSONエクスポート/インポート機能
	•	データ破損防止のため保存時はJSONバリデーション

2.7 PWA
	•	manifest.json設定
	•	Service Worker（Workbox）で静的アセットキャッシュ
	•	オフライン起動可
	•	オフライン時に入力→再接続後に保存反映

⸻

3. 非機能要件
	•	保存操作 → 表示更新まで150ms以内
	•	AI分類なしでも快適に利用可能
	•	大量件数（5,000件想定）でも検索・切替は1s以内
	•	PWAインストール可能（Add to Home Screenを促すUIを設置）
	•	デザインはアクセントカラーをCSS変数で管理（後から差し替え可）
	•	アクセシビリティ：コントラスト比4.5以上、キーボード操作可能

⸻

4. 将来拡張（v0.2以降）
	•	Supabase移行（Auth＋DB＋RLS）
	•	Gemini APIによる自動タグ分類（提案→ユーザーが確定）
	•	音声入力（Web Speech API or Whisper）
	•	共有機能（要約カードの任意公開、原文は非公開のまま）
	•	複数テーマ（配色変更）

⸻

5. データモデル（LocalStorage）

type Tag = 'todo' | 'idea' | 'memo' | 'other';
type Status = 'active' | 'done' | 'archived';

interface Item {
  id: string;        // ulid()
  content: string;   // 本文
  tags: Tag[];       // 複数タグ
  status: Status;    // todoはdoneにトグル
  createdAt: number; // epoch ms
  updatedAt: number; // epoch ms
}

interface Settings {
  theme: 'terminal-dark';
  accent: string;    // '#2dd4bf'
  showCounter: boolean;
  version: 'v1';
}


⸻

6. 操作ショートカット
	•	Enter：保存 → 次のInput欄にフォーカス
	•	Cmd/Ctrl + Enter：保存してすぐ新しい入力欄に移動
	•	Cmd/Ctrl + 1/2/3：タブ切替（記入/タグ/時系列）
	•	Cmd/Ctrl + K：検索パレット

⸻

