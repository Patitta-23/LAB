# Lab 1 — AI Use and Reflection

**LLM/agent used:** Google Gemini (Antigravity coding agent)

## Selected key prompts (6–10)

| # | Prompt (summarised) | What I did with the result |
|---|---------------------|----------------------------|
| 1 | "ยัดไฟล์เข้า feature/1-project-foundation อย่างเดียว อย่างอื่นเอาออก" | ใช้ผลลัพธ์โดยตรง — branch structure ถูก isolate ตามที่ต้องการ |
| 2 | "ทำ issue2 ให้เสร็จ" (implement GET /api/health) | ตรวจสอบ code ที่ได้ก่อน accept — endpoint ตอบ `{status:"ok", service:"TokTickIT API"}` ถูกต้องตามสเปค |
| 3 | "ช่วยทำ step ถัดไปเลย" (issue 3 & 4: seed + categories endpoint + UI) | ใช้ผลลัพธ์ได้ทันที แต่ต้องรัน `prisma db push` และ `prisma db seed` เองหลังจาก Docker start |
| 4 | "Fix the fetch error 'The string did not match the expected pattern'" | ต้องแก้ไขเพิ่มเติมเอง — agent แก้ URL quoting แต่ต้องเปลี่ยน port จาก 3000 เป็น 3001 เนื่องจาก conflict กับ project อื่น |
| 5 | "ช่วยแก้ไขให้มีข้อความขึ้นแสดงในกรณี Failure Case" | ใช้ผลลัพธ์โดยตรง — error message กลายเป็น human-readable แทน raw browser error |
| 6 | "อยากได้ให้มันขึ้นจาก offline เป็น online แบบตัวอย่างที่แนบ" | agent redesign UI ตามภาพตัวอย่าง — ใช้โดยตรง แต่ต้องรัน `docker start postgres` และ `prisma db seed` ด้วยตนเอง |
| 7 | "ช่วยทำ ai_use.md และ tests.md ด้วย" | ตรวจสอบและแก้ไข test result ที่กรอกให้ตรงกับสิ่งที่รันจริง |

## Reflection
Two or three sentences: การ prompt ที่มีประสิทธิภาพขึ้นเมื่อระบุ context ให้ชัดเจน เช่น แนบภาพตัวอย่าง UI หรือ error message จริงๆ แทนการบอกแค่ว่า "ไม่ได้" ซึ่งทำให้ agent วิเคราะห์ต้นเหตุและแก้ได้ตรงจุดมากขึ้น จุดที่ต้องแก้ไขผลลัพธ์ของ agent คือตอน port conflict — agent แก้ไขโดยเปลี่ยน PORT เป็น 3001 ทั้ง `.env` และ `vite.config.ts` แต่สาเหตุที่แท้จริงคือ Docker container ของ project อื่นใช้ port 3000 อยู่ ซึ่งต้องตรวจสอบ `lsof -i :3000` และ `docker ps` ด้วยตนเองก่อนจะเข้าใจว่าต้องจัดการ Docker ไม่ใช่เปลี่ยน port ของ TokTickIT
