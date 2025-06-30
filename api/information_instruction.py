INFORMATION_INSTRUCTION = """\
<INFORMATION>
### 現在の日時
$DATETIME$


### ユーザーの情報
---
$PREFERENCES$
---


### 過去の会話履歴
---
$PAST_CHATS_TEXT$
---
(上記に過去の会話履歴がない場合は、ユーザーは初めてこのサービスを利用するものと考えてください。)


### ユーザーID
user_id: $USER_ID$
(ユーザーの情報を取得する際に利用してください)


$THEME_CONTENT$


それではユーザーに挨拶を行ってください。
デイリークエストの達成状況について触れたり、おすすめニュースについてアナウンスしたりしてください。
</INFORMATION>
"""
