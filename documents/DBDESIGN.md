# Proxima DB設計

## 概要

Proximaは以下の3つのデータベースを使用します：
- Firestore: リアルタイム性が求められるデータの保存
- CloudSQL: アプリケーションの動作に必要な構造化データの保存
- BigQuery: 分析・レポーティング用のデータウェアハウス

## Firestore

### users
- ユーザーの基本情報・設定を管理
- Firestoreのパス: users/{userId}

```typescript
interface User {
  age: string
  createdAt: Timestamp
  email: string
  firstGreet: string // done or yet
  gender: string
  iotDeviceUrl: string
  location: string // japan
  nickname: string
  status: string
}
```

### sessions
- セッション情報
- Firestoreのパス: users/{userId}/sessions/{sessionId}

```typescript
interface Session {
  id: string
  agentSessionId: string // FEとAgent Engine間でセッションIDをマッピング
  summary: boolean // セッションを長期記憶に保存したらtrue
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

### messages
- チャット履歴
- Firestoreのパス: users/{userId}/sessions/{sessionId}/messages/{messageId}

```typescript
interface Message {
  id: string
  agent: string
  content: string
  createdAt: Timestamp
  loading: boolean
  processing: boolean
  role: string
  status: string
}
```


## CloudSQL

### テーブル: memory
ユーザーの長期記憶情報を管理

```sql
CREATE TABLE memory(
    id            VARCHAR NOT NULL PRIMARY KEY,
    user_id       VARCHAR NOT NULL,
    category      VARCHAR NOT NULL,
    content       VARCHAR NOT NULL,
    created_at    TIMESTAMP NOT NULL,
    updated_at    TIMESTAMP NOT NULL
);
```

### テーブル: information
イベントやニュース情報を管理

```sql
CREATE TABLE information(
    id            VARCHAR NOT NULL PRIMARY KEY,
    user_id       VARCHAR NOT NULL,
    url           VARCHAR NOT NULL,
    category      VARCHAR NOT NULL,
    title         VARCHAR NOT NULL,
    body          VARCHAR NOT NULL,
    recommend_level INTEGER NOT NULL,
    recommend_sentence VARCHAR NOT NULL,
    favorite      BOOLEAN NOT NULL,
    created_at    TIMESTAMP NOT NULL
);
```

### テーブル: tasks
ユーザーのタスク情報を管理

```sql
CREATE TABLE tasks(
    id            VARCHAR NOT NULL PRIMARY KEY,
    user_id       VARCHAR NOT NULL,
    category      VARCHAR NOT NULL,
    title         VARCHAR NOT NULL,
    description   VARCHAR NOT NULL,
    recommend     VARCHAR,
    estimated_time VARCHAR NOT NULL,
    completed     BOOLEAN NOT NULL,
    created_at    TIMESTAMP NOT NULL
);
```

### テーブル: manuscripts
音声原稿と音声ファイル情報を管理

```sql
CREATE TABLE manuscripts(
    id            VARCHAR NOT NULL PRIMARY KEY,
    user_id       VARCHAR NOT NULL,
    character_id  VARCHAR NOT NULL,
    manuscript    VARCHAR NOT NULL,
    ref_info_ids  VARCHAR NOT NULL,
    ref_tasks_ids VARCHAR NOT NULL,
    created_at    TIMESTAMP NOT NULL,
    updated_at    TIMESTAMP NOT NULL,
    audio_gcs_path VARCHAR NOT NULL,
    audio_signed_url VARCHAR NOT NULL
);
```

### テーブル: routines
定期的なタスクを管理

```sql
CREATE TABLE routines (
    id          VARCHAR NOT NULL PRIMARY KEY,
    user_id     VARCHAR NOT NULL,
    title       VARCHAR NOT NULL,
    description VARCHAR NOT NULL,
    frequency   VARCHAR NOT NULL,
    time        VARCHAR NOT NULL,
    streak      INTEGER NOT NULL,
    category    VARCHAR NOT NULL,
    completed   BOOLEAN NOT NULL,
    created_at  TIMESTAMP NOT NULL,
    deleted     BOOLEAN NOT NULL
);
```

### テーブル: career_goals
キャリア目標を管理

```sql
CREATE TABLE career_goals (
    id            VARCHAR NOT NULL PRIMARY KEY,
    user_id       VARCHAR NOT NULL,
    career_title  VARCHAR NOT NULL,
    career_body   VARCHAR NOT NULL,
    target_period VARCHAR NOT NULL,
    created_at    TIMESTAMP NOT NULL,
    deleted       BOOLEAN NOT NULL
);
```

### テーブル: initiatives
具体的な行動計画を管理

```sql
CREATE TABLE initiatives (
    id            VARCHAR NOT NULL PRIMARY KEY,
    user_id       VARCHAR NOT NULL,
    title         VARCHAR NOT NULL,
    body          VARCHAR NOT NULL,
    target_period VARCHAR NOT NULL,
    created_at    TIMESTAMP NOT NULL,
    deleted       BOOLEAN NOT NULL
);
```

### テーブル: advices
アドバイス情報を管理

```sql
CREATE TABLE advices (
    id         VARCHAR NOT NULL PRIMARY KEY,
    user_id    VARCHAR NOT NULL,
    markdown   VARCHAR NOT NULL,
    created_at TIMESTAMP NOT NULL,
    deleted    BOOLEAN NOT NULL
);
```

## BigQuery
Agent Engineの入出力ログを取得し評価に活用

```sql
CREATE TABLE chat (
  id: STRING
  user_id: STRING
  session_id: STRING
  agent_session_id: STRING
  content_type: STRING
  content: STRING
  meta: JSON
  created_at: TIMESTAMP
)
```
