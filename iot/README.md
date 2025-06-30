# IoT

スマートスピーカーを用いて音声処理を行う
(Google Nest Miniを用いて動作確認済み)

参考: [Google Home Developer Center](https://developers.home.google.com/?hl=ja)

### Localでの起動
```
# サーバーの立ち上げ (0.0.0.0:8080 で公開)
cd iot
uv run python main.py

# ngrokで外部に公開
# - Google Nextからmp3ファイルが取得できるようにするため
# - ここで公開するURLを環境変数のPUBLIC_URLに設定する
ngrok http --domain=xxx 8080

# curlでリクエスト
curl -X POST "http://localhost:8080/talk" \
    -H "Content-Type: application/json" \
    -d "{\"id\": \"$ID\", \"audio_signed_url\": \"$AUDIO_SIGNED_URL\"}"
```
