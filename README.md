````
titie: README
date: 2020-11-08
````

# Keep livechat message clean for your health.

　これはgreasemonkeyを使ってYouTubeのライブチャットを拡張するツールで、
不快なメッセージやユーザー、あるいは単に邪魔なだけのメッセージを
非表示にする方法を提供します。

It's a tool that uses greasemonkey to extend YouTube's live chat, providing a way to hide offensive messages, users, or just plain annoying messages.


## Install

　greasemonkey/tampermonkeyをインストールした上で、
[yt-livechat-wipe.user.js](https://github.com/seagull-kamome/yt-livechat-wipe/raw/main/yt-livechat-wipe.user.js)
を開いてインストールしてください。


## 使い方

　スクリプトを有効にした状態でYoutubeの配信画面を開いてください。
チャットウィンドウの上部に"[BANN]"と"[Filter]"と書かれたボタンが追加
されます。"[Filter]"をクリックすると設定画面がポップアップします。
"BANN"ボタンについては後で説明します。

　設定画面の上から順に説明します。

## "Hide by message type"
　メッセージの種類に応じてメッセージを隠す機能です。
チェックを外すとその種類のメッセージが表示されなくなります。

   - Guest, Member, Moderator, Owner はユーザの種類に応じて隠します。
   - Super Chat, Super Sticker, Membershipはメッセージの種類に応じて隠します。
   - Banned accountは後述する方法で禁止にしたアカウントのメッセージを
     を隠します。
   - Banned wordは指定した禁止ワードを含むメッセージを隠します。
   - Deleted はモデレータが削除したメッセージを隠します。

## "Bann words"

　見たくないワードを１行に一つづつ正規表現で記述して禁止ワードに指定できます。
ワードを含むメッセージは、"Banned word"がOffになっている場合に非表示になります。

## "Drop user icon to categolize"

　チャット欄のプロフィールアイコンをドラッグ＆ドロップする事で、ユーザを
BANNリストかSAFEリストに登録します。NUTRALにドロップすると登録解除されます。

　BANリストに登録したユーザは"Banned account"がOffになっている場合に隠します。
チャットウィンドウ上部にあるBANNボタンも同様の動作をするショートカットです。
SAFEユーザに登録したユーザは、GuestまたはMemberが非表示になっていても隠しません。

# 今後のためのアイデア等

- BANNリストとSAFEリストのエクスポート/インポート
- 簡易的なスパム検出器を使った自動BANN
- SAFEリストに入っている人の偽物を検出
- スパムボット発見用の発言分析モード

以上
