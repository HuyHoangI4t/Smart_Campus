const express = require("express");
const router = express.Router();
const ragService = require("../services/ragService");

// Rate limit in-memory: Chống spam và cào token (tối đa 20 câu / phút / người dùng)
const rateLimitMap = new Map();

/**
 * @swagger
 * /api/chat/ask:
 *   post:
 *     summary: Hỏi đáp với TTN Smart Bot RAG AI (All-in-one Prompt & Strict JSON Output)
 *     tags: [Chatbot RAG]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *               studentContext:
 *                 type: object
 *     responses:
 *       200:
 *         description: Trả về Object chuẩn JSON chứa intent, reply, action và suggested_questions
 */
router.post("/ask", async (req, res) => {
  try {
    const { message, history, studentContext } = req.body;
    let mssv = req.headers["x-mssv"] || studentContext?.mssv;

    // Rate Limiting chống spam/cào token
    const clientKey = mssv || req.ip || "guest";
    const now = Date.now();
    const rateData = rateLimitMap.get(clientKey) || { count: 0, resetTime: now + 60000 };

    if (now > rateData.resetTime) {
      rateData.count = 1;
      rateData.resetTime = now + 60000;
    } else {
      rateData.count++;
      if (rateData.count > 20) {
        return res.status(429).json({
          success: false,
          data: {
            intent: "RATE_LIMITED",
            reply: "Bạn đang gửi câu hỏi quá nhanh. Vui lòng đợi khoảng 1 phút rồi tiếp tục nhé! ⏳",
            action: { type: "NONE", target_id: null },
            suggested_questions: ["Lịch học hôm nay", "Mở bản đồ trường"],
          },
        });
      }
    }
    rateLimitMap.set(clientKey, rateData);

    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "Nội dung câu hỏi không được để trống.",
      });
    }

    const botResult = await ragService.answerQuestionUnified(message, mssv, studentContext, history);

    return res.status(200).json({
      success: true,
      data: botResult,
    });
  } catch (error) {
    console.error("Chat Error:", error);
    return res.status(500).json({
      success: false,
      data: {
        intent: "ERROR",
        reply: "Hệ thống đang bảo trì hoặc quá tải, bạn thử lại sau ít phút nhé!",
        action: { type: "NONE", target_id: null },
        suggested_questions: ["Xem lịch học hôm nay", "Mở bản đồ 3D"],
      },
    });
  }
});

/**
 * @swagger
 * /api/chat/suggestions:
 *   get:
 *     summary: Lấy danh sách câu hỏi gợi ý thông minh
 *     tags: [Chatbot RAG]
 */
router.get("/suggestions", (req, res) => {
  try {
    const suggestions = ragService.getSuggestedQuestions();
    res.json({
      success: true,
      data: suggestions,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi lấy danh sách gợi ý",
      error: error.message,
    });
  }
});

module.exports = router;
