'use server'
// https://codelabs.developers.google.com/codelabs/deploy-application-with-database/cloud-sql-nextjs?hl=ja#7

import pg from 'pg';
import { Connector, AuthTypes} from '@google-cloud/cloud-sql-connector';
import { Quest, ProfileData, CareerGoal, Article, Routine, Initiative, Advice } from '@/app/types';
import { ulid } from 'ulid';

const connector = new Connector();

const clientOpts = await connector.getOptions({
    instanceConnectionName: `${process.env.PROJECT_ID}:${process.env.DB_REGION}:${process.env.DB_INSTANCE_NAME}`,
    authType: 'PASSWORD' as AuthTypes
});

const pool = new pg.Pool({
  ...clientOpts,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

export async function getDailyTasks(userId: string): Promise<Quest[]> {
  // 一旦全日程のタスクを取得する
  // FEで日付を絞り込む.
  // created_atは日本時間で取得する
  const sql = "SELECT id, user_id, title, description, recommend, completed, category, estimated_time, created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Tokyo' AS created_at FROM tasks WHERE user_id = $1 ORDER BY created_at DESC"
  const client = await pool.connect();
  try {
    const result = await client.query(sql, [userId]);
    const tasks: Quest[] = result.rows.map((task: { id: string, user_id: string, title: string, description: string, recommend: string, completed: boolean, category: string, estimated_time: string, created_at: string }) => ({
      id: task.id,
      userId: task.user_id,
      title: task.title,
      description: task.description,
      recommend: task.recommend,
      completed: task.completed,
      category: task.category,
      estimatedTime: task.estimated_time,
      createdAt: task.created_at,
    }));
    return tasks;
  } finally {
    client.release();
  }
}

export async function createTask({ userId, title, description, category, estimatedTime, }: Omit<Quest, "id" | "recommend" | "completed" | "createdAt">): Promise<Quest> {
  const uuid = ulid();
  const sql = `INSERT INTO tasks (id, user_id, title, description, recommend, category, completed, estimated_time, created_at)
    VALUES ($1, $2, $3, $4, $5, $6, false, $7, NOW())
    RETURNING *`;
  const client = await pool.connect();
  const recommend = "";
  try {
    const result = await client.query(sql, [uuid, userId, title, description, recommend, category, estimatedTime]);
    const quest = result.rows[0];
    return {
      id: quest.id,
      userId: quest.user_id,
      title: quest.title,
      description: quest.description,
      recommend: quest.recommend,
      category: quest.category,
      estimatedTime: quest.estimated_time,
      completed: quest.completed,
      createdAt: quest.created_at,
    };
  } finally {
    client.release();
  }
}

export async function updateTaskCompletion(id: string, completed: boolean): Promise<{ completed: boolean }> {
  const sql = `UPDATE tasks SET completed = $1 WHERE id = $2 RETURNING completed`;
  const client = await pool.connect();
  try {
    const result = await client.query(sql, [completed, id]);
    return result.rows[0];
  } finally {
    client.release();
  }
}

export async function deleteTask(id: string): Promise<{ ok: boolean }> {
  const sql = 'DELETE FROM tasks WHERE id = $1';
  const client = await pool.connect();
  try {
    await client.query(sql, [id]);
    return { ok: true };
  } finally {
    client.release();
  }
}

export async function createUserProfile(userId: string, profile: ProfileData): Promise<void> {
  const client = await pool.connect();
  const fields: [string, string, string][] = [
    ['nickname', 'ニックネーム', profile.nickname],
    ['gender', '性別', profile.gender],
    ['age', '年齢', profile.age],
    ['location', '居住地', profile.location],
    ['iotDeviceUrl', 'IoTデバイスURL', profile.iotDeviceUrl || ''],
    // careerGoals配列を1行ずつまとめて追加
    ...((profile.careerGoals || []).map((goal, idx) => ([
      `careerGoal_${idx}`,
      `キャリア目標${idx}`,
      `タイトル: ${goal.careerTitle}｜内容: ${goal.careerBody}｜期間: ${goal.targetPeriod}`
    ])) as [string, string, string][]),
    ...((profile.initiatives || []).map((initiative, idx) => ([
      `initiative_${idx}`,
      `プラン${idx}`,
      `タイトル: ${initiative.title}｜内容: ${initiative.body}｜期間: ${initiative.targetPeriod}`
    ])) as [string, string, string][]),
    ['skills', 'スキル', (profile.skills || []).join(', ')],
    ['currentRole', '現在の役割', profile.currentRole],
    ['experience', '経験', profile.experience],
    ['projects', 'プロジェクト', profile.projects],
    ['learningMethods', '学習方法', (profile.learningMethods || []).join(', ')],
    ['dailyStudyTime', '1日あたりの学習時間', profile.dailyStudyTime],
  ];
  // 空の値を除外
  const validFields = fields.filter(([, , value]) => value && value !== '');
  if (validFields.length === 0) {
    client.release();
    return;
  }
  // バルクインサート用のクエリと値を作成
  const category = 'initialize';
  const valuesSql = validFields.map((_, i) => `($${i * 4 + 1}, $${i * 4 + 2}, $${i * 4 + 3}, $${i * 4 + 4}, (NOW() AT TIME ZONE 'JST'), (NOW() AT TIME ZONE 'JST'))`).join(', ');
  const values = validFields.flatMap(([, label, value]) => [ulid(), userId, category, `${label}: ${value}`]);
  const sql = `INSERT INTO memory (id, user_id, category, content, created_at, updated_at) VALUES ${valuesSql}`;
  try {
    await client.query(sql, values);
  } finally {
    client.release();
  }
}

// careerGoals
export async function createCareerGoals(userId: string, careerGoals: Omit<CareerGoal, "id" | "createdAt" | "deleted">[]): Promise<void> {
  if (careerGoals.length === 0) {
    return;
  }
  const client = await pool.connect();
  // プレースホルダを使う
  const valuesSql = careerGoals.map((_, i) =>
    `($${i * 5 + 1}, $${i * 5 + 2}, $${i * 5 + 3}, $${i * 5 + 4}, $${i * 5 + 5}, NOW(), false)`
  ).join(', ');
  const values = careerGoals.flatMap(goal => [
    ulid(),
    userId,
    goal.careerTitle,
    goal.careerBody,
    goal.targetPeriod,
  ]);
  const sql = `INSERT INTO career_goals (id, user_id, career_title, career_body, target_period, created_at, deleted) VALUES ${valuesSql}`;

  try {
    await client.query(sql, values);
  } finally {
    client.release();
  }
}

export async function getCareerGoals(userId: string): Promise<CareerGoal[]> {
  const sql = `SELECT id, user_id, career_title, career_body, target_period, created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Tokyo' AS created_at, deleted FROM career_goals WHERE user_id = $1`;
  const client = await pool.connect();
  try {
    const result = await client.query(sql, [userId]);
    const careerGoals: CareerGoal[] = result.rows.map((goal: { id: string, userId: string, career_title: string, career_body: string, target_period: string, created_at: string, deleted: boolean }) => ({
      id: goal.id,
      userId: goal.userId,
      careerTitle: goal.career_title,
      careerBody: goal.career_body,
      targetPeriod: goal.target_period,
      createdAt: goal.created_at,
      deleted: goal.deleted,
    }));
    return careerGoals;
  } finally {
    client.release();
  }
}

export async function deleteCareerGoals(userId: string, id: string): Promise<{ ok: boolean }> {
  const sql = `DELETE FROM career_goals WHERE user_id = $1 AND id = $2`;
  const client = await pool.connect();
  try {
    await client.query(sql, [userId, id]);
    return { ok: true };
  } finally {
    client.release();
  }
}

// initiatives
export async function createInitiatives(userId: string, initiatives: Omit<Initiative, "id" | "createdAt" | "deleted">[]): Promise<void> {
  if (initiatives.length === 0) {
    return;
  }
  const client = await pool.connect();
  const valuesSql = initiatives.map((_, i) =>
    `($${i * 5 + 1}, $${i * 5 + 2}, $${i * 5 + 3}, $${i * 5 + 4}, $${i * 5 + 5}, NOW(), false)`
  ).join(', ');
  const values = initiatives.flatMap(initiative => [
    ulid(),
    userId,
    initiative.title,
    initiative.body,
    initiative.targetPeriod,
  ]);
  const sql = `INSERT INTO initiatives (id, user_id, title, body, target_period, created_at, deleted) VALUES ${valuesSql}`;
  try {
    await client.query(sql, values);
  } finally {
    client.release();
  }
}

export async function getInitiatives(userId: string): Promise<Initiative[]> {
  const sql = `SELECT id, user_id, title, body, target_period, created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Tokyo' AS created_at, deleted FROM initiatives WHERE user_id = $1`;
  const client = await pool.connect();
  try {
    const result = await client.query(sql, [userId]);
    const initiatives: Initiative[] = result.rows.map((initiative: { id: string, userId: string, title: string, body: string, target_period: string, created_at: string, deleted: boolean }) => ({
      id: initiative.id,
      userId: initiative.userId,
      title: initiative.title,
      body: initiative.body,
      targetPeriod: initiative.target_period,
      createdAt: initiative.created_at,
      deleted: initiative.deleted,
    }));
    return initiatives;
  } finally {
    client.release();
  }
}

export async function deleteInitiatives(userId: string, id: string): Promise<{ ok: boolean }> {
  const sql = `DELETE FROM initiatives WHERE user_id = $1 AND id = $2`;
  const client = await pool.connect();
  try {
    await client.query(sql, [userId, id]);
    return { ok: true };
  } finally {
    client.release();
  }
}

export async function getArticles(userId: string): Promise<Article[]> {
  const sql = `SELECT id, user_id, url, category, title, body, recommend_level, recommend_sentence, favorite, created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Tokyo' AS created_at FROM information WHERE user_id = $1 ORDER BY created_at DESC`;
  const client = await pool.connect();
  try {
    const result = await client.query(sql, [userId]);
    const articles: Article[] = result.rows.map((article: { id: string, userId: string, url: string, category: string, title: string, body: string, recommend_level: number, recommend_sentence: string, favorite: boolean, created_at: string }) => ({
      id: article.id,
      userId: article.userId,
      url: article.url,
      category: article.category,
      title: article.title,
      body: article.body,
      recommendLevel: article.recommend_level,
      recommendSentence: article.recommend_sentence,
      favorite: article.favorite,
      createdAt: article.created_at,
    }));
    return articles;
  } finally {
    client.release();
  }
}

export async function updateArticleFavorite(userId: string, id: string, favorite: boolean): Promise<{ favorite: boolean }> {
  const sql = `UPDATE information SET favorite = $1 WHERE user_id = $2 AND id = $3 RETURNING favorite`;
  const client = await pool.connect();
  try {
    const result = await client.query(sql, [favorite, userId, id]);
    return result.rows[0];
  } finally {
    client.release();
  }
}

export async function getTodaysRoutines(userId: string): Promise<Routine[]> {
  console.log(userId);
  const sql = `SELECT id, user_id, title, description, frequency, time, streak, category, completed, created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Tokyo' AS created_at, deleted 
    FROM routines 
    WHERE user_id = $1 
    AND deleted = false 
    AND created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Tokyo' >= CURRENT_DATE AT TIME ZONE 'Asia/Tokyo'
    ORDER BY created_at DESC`;
  const client = await pool.connect();
  try {
    const result = await client.query(sql, [userId]);
    const routines: Routine[] = result.rows.map((routine: { id: string, userId: string, title: string, description: string, frequency: string, time: string, streak: number, category: string, completed: boolean, created_at: string, deleted: boolean }) => ({
      id: routine.id,
      userId: routine.userId,
      title: routine.title,
      description: routine.description,
      frequency: routine.frequency,
      time: routine.time,
      streak: routine.streak,
      category: routine.category,
      completed: routine.completed,
      createdAt: routine.created_at,
      deleted: routine.deleted,
    }));
    return routines;
  } finally {
    client.release();
  }
}

export async function createRoutine(input: Omit<Routine, "id" | "streak" | "completed" | "createdAt" | "deleted">): Promise<Routine> {
  const sql = `INSERT INTO routines (id, user_id, title, description, frequency, time, streak, category, completed, created_at, deleted) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), $10) RETURNING *`;
  const values = [ulid(), input.userId, input.title, input.description, input.frequency, input.time, 0, input.category, false, false];
  const client = await pool.connect();
  try {
    const result = await client.query(sql, values);
    const routine = result.rows[0];
    return {
      id: routine.id,
      userId: routine.user_id,
      title: routine.title,
      description: routine.description,
      frequency: routine.frequency,
      time: routine.time,
      streak: routine.streak,
      category: routine.category,
      completed: routine.completed,
      createdAt: routine.created_at,
      deleted: routine.deleted,
    } as Routine;
  } finally {
    client.release();
  }
}

export async function updateRoutineCompletion(userId: string, id: string, completed: boolean): Promise<{ completed: boolean }> {
  const sql = `UPDATE routines SET completed = $1 WHERE user_id = $2 AND id = $3 RETURNING completed`;
  const client = await pool.connect();
  try {
    const result = await client.query(sql, [completed, userId, id]);
    return result.rows[0];
  } finally {
    client.release();
  }
}

export async function deleteRoutine(id: string): Promise<{ ok: boolean }> {
  const sql = `UPDATE routines SET deleted = true WHERE id = $1`;
  const client = await pool.connect();
  try {
    await client.query(sql, [id]);
    return { ok: true };
  } finally {
    client.release();
  }
}

export async function getAdvice(userId: string): Promise<Advice|null> {
  const sql = `SELECT id, user_id, markdown, created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Tokyo' AS created_at, deleted FROM advices WHERE user_id = $1 AND deleted = false ORDER BY created_at DESC LIMIT 1`;
  const client = await pool.connect();
  try {
    const result = await client.query(sql, [userId]);
    const advice = result.rows[0];
    if (!advice) {
      return null;
    }
    return {
      id: advice.id,
      userId: advice.user_id,
      markdown: advice.markdown,
      createdAt: advice.created_at,
      deleted: advice.deleted,
    };
  } finally {
    client.release();
  }
}