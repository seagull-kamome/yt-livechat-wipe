---
titie: README
date: 2020-11-08
---

# Keep livechat message clean for your health.

　これはgreasemonkeyを使ってYouTubeのライブチャットを拡張するツールで、
不快なメッセージやユーザー、あるいは単に邪魔なだけのメッセージを
非表示にする方法を提供します。

It's a tool that uses greasemonkey to extend YouTube's live chat, providing
a way to hide offensive messages, users, or just plain annoying messages.


## Install

　greasemonkey/tampermonkeyをインストールした上で、
[yt-livechat-wipe.user.js](https://github.com/seagull-kamome/yt-livechat-wipe/raw/main/yt-livechat-wipe.user.js)
を開いてインストールしてください。

Install greasemonkey or tampermonkey before. Then visit
[yt-livechat-wipe.user.js](https://github.com/seagull-kamome/yt-livechat-wipe/raw/main/yt-livechat-wipe.user.js)
and install the script.


## 使い方

　スクリプトを有効にした状態でYoutubeの配信画面を開いてください。
チャットウィンドウの上部に"[BANN]"と"[Filter]"と書かれたボタンが追加
されます。"[Filter]"をクリックすると設定画面がポップアップします。
"BANN"ボタンについては後で説明します。

Open any youtube chat stream under the script enabled. Now you can see
two buttons, titled "[BANN]" and "[Filter]", at top of chat window.
Click the "[Filter]" button to open or close a settings window.
The BANN button will be explained later.

## "Drop user icon to categolize"

　チャット欄のプロフィールアイコンをドラッグ＆ドロップする事で、ユーザを
BANNリストかSAFEリストに登録します。NUTRALにドロップすると登録解除されます。

　BANリストに登録したユーザは"Banned account"がOffになっている場合に隠します。
チャットウィンドウ上部にあるBANNボタンも同様の動作をするショートカットです。
SAFEユーザに登録したユーザは、GuestまたはMemberが非表示になっていても隠しません。

　BANNボタンまたｈSAFEボタンにカーソルを置くと、ドロップダウンメニューが
表示されるので、Resetをクリックするとそれぞれのリストが消去されます。


## "Hide by message type"
　メッセージの種類に応じてメッセージを隠す機能です。
チェックを外すとその種類のメッセージが表示されなくなります。

   - Guest, Member, Moderator, Owner : ユーザの種類に応じて隠します。
   - Super Chat, Super Sticker, Membership : メッセージの種類に応じて隠します。
   - Banned account : 後述する方法で禁止にしたアカウントのメッセージを
     を隠します。
   - Banned word : 指定した禁止ワードを含むメッセージを隠します。
   - Deleted : モデレータが削除したメッセージを隠します。
   - Too much emojis : 絵文字を10以上含むメッセージを隠します。Youtube独自文字と
     チャンネル専用絵文字は数に含みません。
   - Spoofing : メンバーと同じ名前のゲストアカウントを、成りすましとみなして
     非表示にします。
   - Over n posts in xx sec. : 連投制限に引っかかったメッセージを非表示にします。

## "Bann words"

　見たくないワードを１行に一つづつ正規表現で記述して禁止ワードに指定できます。
ワードを含むメッセージは、"Banned word"がOffになっている場合に非表示になります。

# 今後のためのアイデア等

- BANNリストとSAFEリストのエクスポート/インポート
- 簡易的なスパム検出器を使った自動BANN
- スパムボット発見用の発言分析モード

以上
