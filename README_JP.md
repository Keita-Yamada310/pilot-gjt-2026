# 6段階GJTパイロット（jsPsych + GitHub Pages + DataPipe）

## この版の仕様

- 30項目
- 15 grammatical / 15 ungrammatical
- 全参加者が同じ30項目を見る
- 項目順のみ参加者ごとにランダム化
- 6段階評定：1 = 明らかに非文法的、6 = 明らかに文法的
- 1項目10秒
- 練習2項目
- RT、評定、タイムアウト、項目情報をCSVに保存
- DataPipe設定済みの場合はOSFへ保存
- DataPipe保存失敗時はCSVをローカル保存

## 1. DataPipeを使う場合

1. OSFでプロジェクトを作成する。
2. DataPipeにOSFアカウントでログインする。
3. DataPipeで新しいExperimentを作成する。
4. OSF Project IDとData Component Nameを設定する。
5. Data collectionを有効にする。
6. DataPipe Experiment IDをコピーする。
7. `config.js` を開き、次を変更する。

```javascript
const DATAPIPE_EXPERIMENT_ID = "ここにExperiment ID";
```

注意：DataPipeを使わず動作だけ確認する場合は空欄のままでよいです。その場合、終了時にCSVが参加者PCへダウンロードされます。

## 2. GitHubへアップロード

1. GitHubで新しいrepositoryを作成する。
2. このフォルダ内のファイルをすべてrepositoryのルートへアップロードする。
3. `Settings` → `Pages` を開く。
4. `Build and deployment` のSourceを `Deploy from a branch` にする。
5. Branchを `main`、Folderを `/(root)` にしてSaveする。
6. 数分後に表示されるURLを開く。

必要ファイル：

- `index.html`
- `config.js`
- `stimuli.js`
- `experiment.js`
- `style.css`
- `.nojekyll`

## 3. 本番前の確認

最低でも次を確認してください。

1. PCを変えてページが開く。
2. 参加者番号を入力できる。
3. 全画面表示になる。
4. 練習2問の後に本課題30問が出る。
5. 6つのボタンが押せる。
6. 10秒で無回答終了する。
7. 項目順が再読み込みごとに変わる。
8. DataPipe利用時はOSFにCSVが保存される。
9. CSVに `participant_id`, `item_id`, `rating`, `rt`, `timed_out`,
   `category`, `target_verb`, `target_pattern`, `presented_status` が入る。
10. 40台同時実施前に、5～10台で同時接続テストを行う。

## 4. 40名実施時の運用

- 全員に同じURLを配布する。
- 参加者番号は重複しないものを事前配布する。
- ブラウザはChromeまたはEdgeに統一する。
- 実施前に他のタブと不要なアプリを閉じる。
- 途中で再読み込みしないよう指示する。
- 終了画面が出るまでブラウザを閉じないよう指示する。
- DataPipeのsession limitを40より多く設定する。再試行を考慮し、60程度が安全。

## 5. 変更する場所

- 制限時間：`config.js` の `TRIAL_DURATION_MS`
- 項目順のランダム化：`config.js` の `RANDOMIZE_ITEMS`
- 刺激文：`stimuli.js`
- 教示・画面：`experiment.js`
- デザイン：`style.css`

## 6. 注意

GitHub PagesはHTML・CSS・JavaScriptを公開する静的ホスティングです。GitHub Pagesだけでは参加者データをサーバーに保存できません。データを集中保存するにはDataPipe/OSF等が必要です。
