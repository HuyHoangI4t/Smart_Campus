const axios = require("axios");
const db = require("../config/db");

// Bộ tài liệu mẫu ban đầu để tự động seed vào database nếu bảng campus_knowledge trống
const INITIAL_DOCUMENTS = [
  {
    category: "academic",
    title: "Quy chế Đào tạo Tín chỉ & Cách tính điểm GPA (Hệ 10 sang Hệ 4)",
    keywords: "tính điểm, gpa, thang điểm 4, thang điểm 10, điểm chữ, xếp loại, học phần, tín chỉ",
    content: `Quy chế tính điểm và quy đổi thang điểm tại Đại học Tây Nguyên:\n- Thang điểm học phần gồm: Điểm bộ phận/quá trình (ĐBP 40%) và Điểm thi kết thúc học phần (60%).\n- Quy đổi từ Thang điểm 10 sang Điểm chữ và Thang điểm 4:\n  • 8.5 đến 10.0: Điểm A -> 4.0 (Giỏi/Xuất sắc)\n  • 7.0 đến 8.4: Điểm B -> 3.0 (Khá)\n  • 5.5 đến 6.9: Điểm C -> 2.0 (Trung bình)\n  • 4.0 đến 5.4: Điểm D -> 1.0 (Trung bình yếu)\n  • Dưới 4.0: Điểm F -> 0.0 (Không đạt, bắt buộc đăng ký học lại)\n  • Điểm P (Pass): Dành cho GDTC, GDQP-AN (tích lũy tín chỉ, không tính GPA).\n- Xếp loại GPA toàn khóa: Xuất sắc (3.60 - 4.00), Giỏi (3.20 - 3.59), Khá (2.50 - 3.19), Trung bình (2.00 - 2.49), Yếu (dưới 2.00).`,
  },
  {
    category: "policy",
    title: "Chính sách Học bổng Khuyến khích Học tập & Khen thưởng",
    keywords: "học bổng, xét học bổng, khen thưởng, tiêu chuẩn học bổng, điểm rèn luyện, học phí",
    content: `Tiêu chuẩn xét cấp Học bổng Khuyến khích học tập tại Trường ĐH Tây Nguyên:\n1. Điều kiện tiên quyết: Đăng ký >= 14 tín chỉ trong kỳ, không có môn điểm F, điểm rèn luyện >= 70 (Khá trở lên).\n2. Mức học bổng: Xuất sắc (GPA >= 3.60 & ĐRL >= 90, thưởng 120-140% học phí); Giỏi (GPA 3.20 - 3.59 & ĐRL >= 80, thưởng 110%); Khá (GPA 2.50 - 3.19 & ĐRL >= 70, thưởng 100%).`,
  },
  {
    category: "academic",
    title: "Quy định Cảnh báo Học vụ & Buộc thôi học",
    keywords: "cảnh báo học vụ, thôi học, bị đuổi học, nợ môn, điểm liệt, đình chỉ",
    content: `Quy định xử lý học vụ tại ĐH Tây Nguyên:\n- Bị cảnh báo học vụ nếu: GPA học kỳ < 1.00 (học kỳ đầu) hoặc < 1.20 (các kỳ tiếp); hoặc GPA tích lũy < 1.20 (năm 1), < 1.40 (năm 2), < 1.60 (năm 3), < 1.80 (năm tiếp theo).\n- Bị buộc thôi học nếu: Bị cảnh báo học vụ 3 lần liên tiếp hoặc vượt quá thời gian đào tạo tối đa (6 năm hệ 4 năm, 7 năm hệ 5 năm).`,
  },
  {
    category: "campus",
    title: "Sơ đồ Nhà học, Giảng đường & Địa điểm trong khuôn viên Trường",
    keywords: "nhà học, giảng đường, ở đâu, vị trí, tìm đường, nhà điều hành, thư viện, ktx, nhà 9, nhà 8, nhà 7, nhà 5, nhà 2, nhà 6",
    content: `Vị trí các khu vực trong khuôn viên ĐH Tây Nguyên (567 Lê Duẩn - Trường không dùng tên Tòa A, B, C):\n- Tòa nhà Điều hành (Khu Hiệu bộ): Tòa nhà trung tâm 7 tầng, Phòng Đào tạo (Tầng 1), Phòng CTSV (Tầng 1).\n- Nhà học số 9: Trụ sở chính Khoa Khoa học Tự nhiên và Công nghệ (Khoa KHTN & CN / CNTT), gồm Văn phòng Khoa, khu giảng đường học tập và 8 phòng máy tính thực hành hiện đại tại Tầng 2 & 3.\n- Nhà học số 8: Giảng đường Khoa Sư phạm.\n- Nhà học số 7: Giảng đường Khoa Kinh tế, Trung tâm Ngoại ngữ - Tin học. Đặc biệt: Văn phòng Bộ môn (VP Bộ môn CNTT - Khoa KHTN & CN) đặt tại phòng 7.4.25 (Tầng 4).\n- Nhà học số 5: Giảng đường Khoa Y Dược, phòng thực hành Y.\n- Bệnh viện Trường ĐH Tây Nguyên: Bệnh viện thực hành đa khoa.\n- Nhà học số 2: Giảng đường Khoa Ngoại ngữ và Lý luận chính trị.\n- Nhà học số 6: Giảng đường học tập chung các môn đại cương.\n- Giảng đường 400 chỗ & 200 chỗ: Hội trường lớn tổ chức sự kiện và lớp học đông.\n- Thư viện Trung tâm: Đối diện hồ sinh thái, phòng tự học và tài liệu.\n- Ký túc xá: KTX 1, KTX 2, KTX 3, KTX 4, KTX Lào - Campuchia.\n- Khu thể thao: Sân vận động, Nhà thi đấu, Hồ bơi, Sân quần vợt. Căn tin - Đảo sinh viên.`,
  },
  {
    category: "academic",
    title: "Thông tin Khoa Công nghệ Thông tin & Chương trình Đào tạo",
    keywords: "khoa cntt, công nghệ thông tin, kỹ thuật phần mềm, lập trình, nhà 9, phòng máy",
    content: `Khoa Công nghệ Thông tin - Trường Đại học Tây Nguyên:\n- Văn phòng Khoa: Tầng 2 Nhà học số 9 (Khoa KHTN & Công nghệ).\n- Chuyên ngành đào tạo: Công nghệ Thông tin, Kỹ thuật Phần mềm, Hệ thống Thông tin.\n- Hệ thống phòng máy tính: 8 phòng máy thực hành tại Tầng 2 & 3 Nhà học số 9, mạng cáp quang tốc độ cao phục vụ Lập trình di động, Cơ sở dữ liệu, Mạng máy tính, Trí tuệ nhân tạo.`,
  },
];

class VectorDbService {
  constructor() {
    this.memoryVectors = null;
    this.isInitializing = false;
  }

  /**
   * Tính Cosine Similarity giữa 2 vector
   */
  cosineSimilarity(vecA, vecB) {
    if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
    let dot = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
      dot += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Sinh vector embedding thông qua Gemini Embedding API
   */
  async getEmbedding(text) {
    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey || !text || !text.trim()) return null;

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${geminiKey.trim()}`;
      const res = await axios.post(
        url,
        {
          model: "models/gemini-embedding-001",
          content: {
            parts: [{ text: text.trim().slice(0, 2048) }],
          },
        },
        {
          timeout: 10000,
          headers: { "Content-Type": "application/json" },
        }
      );

      const values = res.data?.embedding?.values;
      if (Array.isArray(values) && values.length > 0) {
        return values;
      }
    } catch (err) {
      console.warn("⚠️ [Embedding API Warning]:", err.response?.data?.error?.message || err.message);
    }
    return null;
  }

  /**
   * Khởi tạo bảng campus_knowledge và nạp toàn bộ dữ liệu từ DB vào vector space
   */
  async initializeVectorStore() {
    if (this.isInitializing) return;
    this.isInitializing = true;

    try {
      // 1. Tạo bảng campus_knowledge nếu chưa có
      await db.query(`
        CREATE TABLE IF NOT EXISTS campus_knowledge (
          id INT AUTO_INCREMENT PRIMARY KEY,
          category VARCHAR(100) NOT NULL,
          title VARCHAR(500) NOT NULL,
          content LONGTEXT NOT NULL,
          keywords VARCHAR(500) DEFAULT NULL,
          source_table VARCHAR(100) DEFAULT 'system',
          source_id INT DEFAULT NULL,
          embedding LONGTEXT DEFAULT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_ck_cat (category)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      // 2. Đồng bộ các tài liệu tri thức chuẩn vào MySQL nếu chưa có
      const [existingRows] = await db.query("SELECT title FROM campus_knowledge");
      const existingTitles = new Set(existingRows.map((r) => r.title));

      for (const doc of INITIAL_DOCUMENTS) {
        if (!existingTitles.has(doc.title)) {
          await db.query(
            "INSERT INTO campus_knowledge (category, title, content, keywords, source_table) VALUES (?, ?, ?, ?, 'system')",
            [doc.category, doc.title, doc.content, doc.keywords || ""]
          );
        }
      }

      // 3. Đồng bộ các địa điểm trong map_locations vào campus_knowledge
      try {
        const [locations] = await db.query(
          "SELECT id, name, category, building, floor, description FROM map_locations WHERE name IS NOT NULL AND name != ''"
        );
        for (const loc of locations) {
          const locTitle = `Địa điểm: ${loc.name} (${loc.building || "Khuôn viên"})`;
          if (!existingTitles.has(locTitle)) {
            const content = `Địa điểm ${loc.name} thuộc ${loc.building || "Đại học Tây Nguyên"}${
              loc.floor ? `, tầng ${loc.floor}` : ""
            }. Thể loại: ${loc.category || "Học tập"}. Mô tả: ${loc.description || "Địa điểm trong trường"}.`;
            await db.query(
              "INSERT INTO campus_knowledge (category, title, content, keywords, source_table, source_id) VALUES ('map', ?, ?, ?, 'map_locations', ?)",
              [locTitle, content, `${loc.name}, ${loc.building || ""}`, loc.id]
            );
          }
        }
      } catch (locErr) {
        console.warn("⚠️ [Location Sync Notice]:", locErr.message);
      }

      // 4. Lấy tất cả bản ghi cần tạo Vector Embeddings
      const [allDocs] = await db.query("SELECT id, title, content, embedding FROM campus_knowledge");

      let updatedCount = 0;
      for (const item of allDocs) {
        if (!item.embedding) {
          const textToEmbed = `Tiêu đề: ${item.title}\nNội dung: ${item.content}`;
          const vec = await this.getEmbedding(textToEmbed);
          if (vec) {
            await db.query("UPDATE campus_knowledge SET embedding = ? WHERE id = ?", [
              JSON.stringify(vec),
              item.id,
            ]);
            item.embedding = JSON.stringify(vec);
            updatedCount++;
            await new Promise((resolve) => setTimeout(resolve, 300));
          }
        }
      }

      if (updatedCount > 0) {
        console.log(`✅ [Vector Store]: Đã chuyển đổi và lưu ${updatedCount} vector embeddings vào MySQL.`);
      }

      // 5. Nạp toàn bộ vectors vào bộ nhớ RAM để tra cứu siêu tốc
      const [cachedRows] = await db.query("SELECT id, title, content, category, embedding FROM campus_knowledge");
      this.memoryVectors = cachedRows.map((row) => {
        let parsed = null;
        if (row.embedding) {
          try {
            parsed = typeof row.embedding === "string" ? JSON.parse(row.embedding) : row.embedding;
          } catch {}
        }
        return {
          id: row.id,
          title: row.title,
          content: row.content,
          category: row.category,
          embedding: Array.isArray(parsed) ? parsed : null,
        };
      });

      console.log(`🎯 [Vector Store Ready]: Sẵn sàng với ${this.memoryVectors.length} tri thức từ Database.`);
    } catch (err) {
      console.error("❌ Lỗi khởi tạo Vector Store:", err);
    } finally {
      this.isInitializing = false;
    }
  }

  /**
   * Tìm kiếm các tài liệu có độ tương đồng Vector cao nhất (Cosine Similarity)
   */
  async searchVector(query, topK = 4) {
    if (!this.memoryVectors || this.memoryVectors.length === 0) {
      await this.initializeVectorStore();
    }

    if (!this.memoryVectors || this.memoryVectors.length === 0) {
      return [];
    }

    // 1. Chuyển câu hỏi của sinh viên sang Vector Embedding
    const queryVector = await this.getEmbedding(query);

    if (queryVector) {
      const scored = this.memoryVectors
        .filter((item) => Array.isArray(item.embedding))
        .map((item) => {
          const score = this.cosineSimilarity(queryVector, item.embedding);
          return { ...item, score };
        });

      scored.sort((a, b) => b.score - a.score);
      return scored.slice(0, topK);
    }

    // 2. Fallback tìm kiếm từ khóa
    const tokens = query.toLowerCase().split(/\s+/).filter((t) => t.length > 1);
    const scored = this.memoryVectors.map((item) => {
      let score = 0;
      const tLower = item.title.toLowerCase();
      const cLower = item.content.toLowerCase();
      tokens.forEach((tk) => {
        if (tLower.includes(tk)) score += 3;
        if (cLower.includes(tk)) score += 1;
      });
      return { ...item, score };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, topK);
  }
}

module.exports = new VectorDbService();
