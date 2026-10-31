import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query, isUsingPostgres, getMemoryStore, persistStore } from '../db.js';
import { createKbArticleSchema, validate } from '../middleware/validation.js';

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const { q, category } = req.query;
    const memory = getMemoryStore();

    let articles = [];

    if (isUsingPostgres()) {
      let sql = `
        SELECT k.*, u.name as author_name
        FROM kb_articles k
        LEFT JOIN users u ON k.created_by = u.id
        ORDER BY k.created_at DESC
      `;
      const result = await query(sql);
      articles = result.rows;
    } else {
      articles = memory.kb_articles.map(k => {
        const author = memory.users.find(u => u.id === k.created_by);
        return {
          ...k,
          author_name: author?.name || 'OmniX Support Lead'
        };
      });
      articles.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    if (category && category !== 'All') {
      articles = articles.filter(a => (a.category || '').toLowerCase() === category.toLowerCase());
    }

    if (q && q.trim() !== '') {
      const search = q.trim().toLowerCase();
      articles = articles.filter(a =>
        a.title.toLowerCase().includes(search) ||
        a.content.toLowerCase().includes(search) ||
        (a.tags && a.tags.some(t => t.toLowerCase().includes(search)))
      );
    }

    res.json({
      success: true,
      data: articles
    });
  } catch (err) {
    next(err);
  }
});

router.post('/', validate(createKbArticleSchema), async (req, res, next) => {
  try {
    const { title, content, category, tags = [] } = req.validatedBody;
    const memory = getMemoryStore();
    const id = uuidv4();
    const now = new Date().toISOString();
    const createdBy = memory.users[0]?.id || null; // Default Sarah Lin

    let created = null;

    if (isUsingPostgres()) {
      const insertSql = `
        INSERT INTO kb_articles (id, title, content, category, tags, created_by, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;
      const result = await query(insertSql, [id, title, content, category, tags, createdBy, now]);
      created = result.rows[0];
    } else {
      created = {
        id,
        title,
        content,
        category,
        tags,
        created_by: createdBy,
        created_at: now
      };
      memory.kb_articles.unshift(created);
      persistStore();
    }

    const author = memory.users.find(u => u.id === createdBy);

    res.status(201).json({
      success: true,
      message: 'Knowledge base article created successfully',
      data: {
        ...created,
        author_name: author?.name || 'OmniX Support Lead'
      }
    });
  } catch (err) {
    next(err);
  }
});

export default router;

