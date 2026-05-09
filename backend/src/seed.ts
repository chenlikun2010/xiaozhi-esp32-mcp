import { AppDataSource, initializeDB } from "./db";
import { MCPService } from "./entities/MCPService";

const seed = async () => {
    await initializeDB();

    const repo = AppDataSource.getRepository(MCPService);
    console.log("Seeding MCP Services...");
    const services: Array<Pick<MCPService, 'name' | 'description' | 'imageUrl'>> = [
        {
            name: "联网搜索服务",
            description: "支持联网查询最新信息，适用于通用问答与实时资讯检索。",
            imageUrl: "/vite.svg"
        },
        {
            name: "做饭助手",
            description: "根据食材和口味推荐菜谱与做法，提供家庭烹饪指导。",
            imageUrl: "/vite.svg"
        },
        {
            name: "MBTI 性格测试",
            description: "提供 MBTI 性格类型分析与结果解读。",
            imageUrl: "/vite.svg"
        },
        {
            name: "股票查询助手",
            description: "支持股票基础信息与行情查询。",
            imageUrl: "/vite.svg"
        },
        {
            name: "汇率查询助手",
            description: "查询常见币种汇率，支持多币种换算。",
            imageUrl: "/vite.svg"
        },
        {
            name: "12306 火车票助手",
            description: "提供火车票余票与车次信息查询。",
            imageUrl: "/vite.svg"
        },
        {
            name: "黄金价格查询",
            description: "查询黄金价格与市场参考数据。",
            imageUrl: "/vite.svg"
        },
        {
            name: "行业报告专家",
            description: "提供行业报告检索与问答能力。",
            imageUrl: "/report_expert.png"
        },
        {
            name: "快递查询助手",
            description: "支持主流快递单号物流轨迹查询。",
            imageUrl: "/vite.svg"
        },
        {
            name: "飞常准航班服务",
            description: "提供航班动态、时刻与相关信息查询。",
            imageUrl: "/vite.svg"
        },
        {
            name: "新闻查询服务",
            description: "聚合科技新闻与资讯，支持关键词检索。",
            imageUrl: "/vite.svg"
        },
        {
            name: "番茄小说全能助手",
            description: "提供番茄小说检索、目录与章节内容能力。",
            imageUrl: "/vite.svg"
        }
    ];

    let created = 0;
    let updated = 0;
    for (const s of services) {
        const existing = await repo.findOne({ where: { name: s.name } });
        if (!existing) {
            const service = repo.create({
                ...s,
                status: 'stopped'
            });
            await repo.save(service);
            created += 1;
        } else {
            existing.description = s.description;
            existing.imageUrl = s.imageUrl;
            await repo.save(existing);
            updated += 1;
        }
    }

    console.log(`Seeding complete. created=${created}, updated=${updated}`);

    process.exit(0);
};

seed();
