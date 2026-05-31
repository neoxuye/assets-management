
// ===============================================
// 资产库与配置数据
// ===============================================

// 资产库 (v16.44: 新增 etfMap 字段，支持境内/境外ETF映射)
const assetLibrary = {
    // v16.48: cnStock 仅代表 A 股（沪深300），港股拆分为独立的 hkStock
    cnStock: {
        name: '🇨🇳 A股', benchmarkTicker: 'ASHR', subcategories: { domestic: { name: '国内A股', assets: { HS300: '沪深300', TECH100: '科创板100', CONSUMER: '消费龙头', INDUSTRY: '工业周期', INNOV: 'A股创新' } } }, sens: { fedRate: -0.15, realYield: -0.20, usd: -0.62, vix: -0.70, creditSpread: -0.40, globalGrowth: 0.78, cnPolicy: 0.05, yieldCurve: 0.4, inflation: 0, momentum: 0.30, adoption: 0, yieldCurve: 0.35, sofrOisSpread: -0.60, pmiDelta: 0.50, fedDotsGap: 0.30, ratePath: -0.25, vixTermStructure: 0.5, creditSpreadMomentum: -0.35 }, rec: { conservative: 0.05, balanced: 0.10, aggressive: 0.15 }, volatility: 0.22,
        etfMap: {
            overseas: [
                { ticker: 'ASHR', name: '沪深300(美股)', expense: '0.65%', note: '⭐ 系统基准标的。直接追踪A股沪深300' }
            ],
            domestic: [
                { ticker: '510300', name: '华泰柏瑞沪深300ETF', expense: '0.15%', note: '场内最大300ETF' },
                { ticker: '510500', name: '南方中证500ETF', expense: '0.15%', note: '中小盘代表' },
                { ticker: '159915', name: '易方达创业板ETF', expense: '0.15%', note: '创业板/科技成长' },
                { ticker: '512100', name: '南方中证1000ETF', expense: '0.15%', note: '小盘/微盘覆盖' },
                { ticker: '159605', name: '广发中证科创创业50ETF', expense: '0.15%', note: '硬科技' }
            ],
            note: '💡 股票类可自选个股替代ETF。ETF 适合追踪整体走势，个股适合有研究能力的投资者。'
        }
    },
    // v16.48: 新增港股/海外中概独立大类
    hkStock: {
        name: '🇭🇰 港股/海外中概', benchmarkTicker: 'MCHI', subcategories: { hongkong: { name: '香港/海外中概', assets: { HKSTOCKS: '港股通', REDCHIP: '红筹股', KWEB: '中概互联' } } }, sens: { fedRate: -0.25, realYield: -0.28, usd: -0.70, vix: -0.80, creditSpread: -0.55, globalGrowth: 0.72, cnPolicy: 0.05, yieldCurve: 0.35, inflation: -0.10, momentum: 0.40, adoption: 0, yieldCurve: 0.35, sofrOisSpread: -0.70, pmiDelta: 0.45, fedDotsGap: 0.35, ratePath: -0.3, vixTermStructure: 0.55, creditSpreadMomentum: -0.4 }, rec: { conservative: 0.03, balanced: 0.07, aggressive: 0.12 }, volatility: 0.28,
        etfMap: {
            primary: [
                { ticker: 'MCHI', name: 'iShares MSCI中国', expense: '0.59%', note: '⭐ 系统基准标的。涵盖港股+ADR中概' },
                { ticker: 'FXI', name: 'iShares中国大盘', expense: '0.74%', note: '境外最常用中国大盘ETF' },
                { ticker: 'KWEB', name: '中概互联网', expense: '0.70%', note: '中国科技/互联网股' }
            ],
            domestic: [
                { ticker: '513050', name: '易方达中概互联ETF', expense: '0.20%', note: '跨境中概股' }
            ],
            note: '💡 港股受美元利率和外资流动性驱动，与A股走势可大幅背离（如2021年差距27pp）。'
        }
    },
    usStock: {
        name: '🗽 美国股票', benchmarkTicker: 'SPY', subcategories: { broadIndex: { name: '宽基指数', assets: { SPX: '标普500', NDX: '纳斯达克100' } }, technology: { name: '科技类', assets: { AI500: 'AI主题', TECH: '美国科技' } }, finance: { name: '金融类', assets: { FINANCE: '美国金融' } }, sector: { name: '其他行业', assets: { ENERGY: '美国能源', XLYUSD: '美国消费', XLV: '美国医疗', XLI: '美国工业', XLRE: '美国房产', XLC: '美国通讯', XLB: '美国材料' } } }, sens: { fedRate: -0.40, realYield: -0.38, usd: 0.65, vix: -0.80, creditSpread: -0.50, globalGrowth: 0.88, cnPolicy: -0.20, yieldCurve: 0.5, inflation: -0.50, momentum: 0.72, adoption: 0, yieldCurve: 0.40, sofrOisSpread: -0.80, pmiDelta: 0.60, fedDotsGap: 0.50, ratePath: -0.6, vixTermStructure: 0.65, creditSpreadMomentum: -0.45 }, rec: { conservative: 0.10, balanced: 0.15, aggressive: 0.20 }, volatility: 0.15,
        etfMap: {
            primary: [
                { ticker: 'SPY', name: 'SPDR标普500', expense: '0.09%', note: '全球流动性最高的ETF' },
                { ticker: 'QQQ', name: '纳斯达克100', expense: '0.20%', note: '科技成长龙头' },
                { ticker: 'VOO', name: 'Vanguard标普500', expense: '0.03%', note: '最低费率宽基' },
                { ticker: 'VTI', name: 'Vanguard全美股', expense: '0.03%', note: '全市场覆盖' }
            ],
            sector: [
                { ticker: 'XLK', name: '科技板块', expense: '0.09%' },
                { ticker: 'XLF', name: '金融板块', expense: '0.09%' },
                { ticker: 'XLE', name: '能源板块', expense: '0.09%' },
                { ticker: 'XLV', name: '医疗板块', expense: '0.09%' },
                { ticker: 'XLRE', name: '房产板块', expense: '0.09%' }
            ],
            note: '💡 股票类可自选个股替代ETF。建议核心仓位用SPY/VOO，卫星仓位可配个股或行业ETF。'
        }
    },
    devStock: {
        name: '🌍 发达市场', benchmarkTicker: 'EFA', subcategories: { asia: { name: '亚太地区', assets: { N225: '日经225', KOSPI: '韩国KOSPI', ASX: '澳大利亚ASX', STRAITS: '新加坡海峡' } }, europe: { name: '欧洲', assets: { STOXX: '欧洲STOXX600', FTSE100: '英国富时' } }, northAmerica: { name: '北美', assets: { TSX: '加拿大TSX' } } }, sens: { fedRate: -0.38, realYield: -0.35, usd: 0.70, vix: -0.75, creditSpread: -0.45, globalGrowth: 0.80, cnPolicy: -0.15, yieldCurve: 0.45, inflation: -0.20, momentum: 0.65, adoption: 0, yieldCurve: 0.35, sofrOisSpread: -0.70, pmiDelta: 0.55, fedDotsGap: 0.40, ratePath: -0.45, vixTermStructure: 0.55, creditSpreadMomentum: -0.4 }, rec: { conservative: 0.05, balanced: 0.08, aggressive: 0.12 }, volatility: 0.14,
        etfMap: {
            primary: [
                { ticker: 'EFA', name: 'iShares发达市场', expense: '0.32%', note: '美国以外发达市场' },
                { ticker: 'VEA', name: 'Vanguard发达市场', expense: '0.05%', note: '低费率替代' }
            ],
            regional: [
                { ticker: 'EWJ', name: '日本', expense: '0.50%' },
                { ticker: 'EWG', name: '德国', expense: '0.50%' },
                { ticker: 'EWU', name: '英国', expense: '0.50%' },
                { ticker: 'EWA', name: '澳大利亚', expense: '0.50%' }
            ],
            note: '💡 股票类可自选个股替代ETF。如看好日本可直接买丰田/索尼等个股。'
        }
    },
    emStock: {
        name: '🚀 新兴市场', benchmarkTicker: 'EEM', subcategories: { brics: { name: 'BRICS', assets: { SENSEX: '印度SENSEX', BVSP: '巴西BOVESPA', RTSI: '俄罗斯RTS' } }, latam: { name: '拉美', assets: { IPC: '墨西哥IPC', MERV: '阿根廷MERV' } }, africa: { name: '非洲', assets: { JALSH: '南非JALSH' } } }, sens: { fedRate: -0.31, realYield: -0.29, usd: -0.48, vix: -0.60, creditSpread: -0.60, globalGrowth: 0.80, cnPolicy: -0.10, yieldCurve: 0.4, inflation: 0.15, momentum: 0.75, adoption: 0, yieldCurve: 0.40, sofrOisSpread: -0.75, pmiDelta: 0.50, fedDotsGap: 0.35, ratePath: -0.35, vixTermStructure: 0.5, creditSpreadMomentum: -0.35 }, rec: { conservative: 0.02, balanced: 0.06, aggressive: 0.12 }, volatility: 0.18,
        etfMap: {
            primary: [
                { ticker: 'EEM', name: 'iShares新兴市场', expense: '0.68%', note: '最常用新兴市场ETF' },
                { ticker: 'VWO', name: 'Vanguard新兴市场', expense: '0.08%', note: '低费率替代' },
                { ticker: 'INDA', name: 'iShares印度', expense: '0.65%', note: '印度单一国家' },
                { ticker: 'EWZ', name: 'iShares巴西', expense: '0.59%', note: '巴西单一国家' }
            ],
            note: '💡 股票类可自选个股替代ETF。新兴市场个股流动性差异大，建议优先用ETF。'
        }
    },
    // v10.0: 债券拆分为3个大类（区域特性不同）
    bonds_us: {
        name: '🇺🇸 美债', benchmarkTicker: 'AGG', subcategories: { us: { name: '美国债券', assets: { US10Y: '美债10年', US30Y: '美债30年', HYG: '高收益债' } } }, sens: { fedRate: -0.47, realYield: -0.45, usd: 0.50, vix: 0.70, creditSpread: -0.15, globalGrowth: -0.40, cnPolicy: 0, yieldCurve: -0.35, inflation: -0.70, momentum: 0, adoption: 0, yieldCurve: -0.30, sofrOisSpread: 0.60, pmiDelta: -0.20, fedDotsGap: -0.30, ratePath: 0.7, vixTermStructure: -0.2, creditSpreadMomentum: 0.3 }, rec: { conservative: 0.30, balanced: 0.20, aggressive: 0.08 }, volatility: 0.05,
        etfMap: {
            primary: [
                { ticker: 'AGG', name: 'iShares综合债券', expense: '0.03%', note: '⭐ 系统基准标的。与creditSpread敏感度(-0.15)匹配' },
                { ticker: 'TLT', name: '20+长期美债', expense: '0.15%', note: '利率敏感型，波动大（久期极端）' },
                { ticker: 'IEF', name: '7-10年中期美债', expense: '0.15%', note: '中等久期，攻守兼备' },
                { ticker: 'SHY', name: '1-3年短期美债', expense: '0.15%', note: '低波动，类现金' },
                { ticker: 'BND', name: 'Vanguard总债券', expense: '0.03%', note: '综合债券市场' },
                { ticker: 'HYG', name: '高收益公司债', expense: '0.49%', note: '信用风险较高' }
            ]
        }
    },
    bonds_china: {
        name: '🇨🇳 中国债券', benchmarkTicker: 'CBON', subcategories: { china: { name: '中国债券', assets: { CNBD10Y: '中国10Y国债', CNBD30Y: '中国30Y国债', CNBD3Y: '中国3Y国债' } } }, sens: { fedRate: -0.15, realYield: -0.13, usd: -0.40, vix: 0.30, creditSpread: -0.10, globalGrowth: -0.20, cnPolicy: 0.10, yieldCurve: -0.2, inflation: -0.50, momentum: 0, adoption: 0, yieldCurve: -0.25, sofrOisSpread: 0.30, pmiDelta: -0.15, fedDotsGap: -0.10, ratePath: 0.2, vixTermStructure: -0.1, creditSpreadMomentum: 0.1 }, rec: { conservative: 0.25, balanced: 0.15, aggressive: 0.05 }, volatility: 0.04,
        etfMap: {
            overseas: [
                { ticker: 'CBON', name: 'VanEck中国债券', expense: '0.50%', note: '境外投资中国债唯一选择' }
            ],
            domestic: [
                { ticker: '511010', name: '国泰上证5年期国债ETF', expense: '0.15%', note: '场内国债标杆' },
                { ticker: '511260', name: '国泰上证十年期国债ETF', expense: '0.15%', note: '长期国债' },
                { ticker: '511020', name: '平安活跃国债ETF', expense: '0.15%', note: '活跃交易品种' },
                { ticker: '511090', name: '30年国债ETF', expense: '0.15%', note: '超长久期' }
            ]
        }
    },
    bonds_global: {
        name: '🌍 全球债券', benchmarkTicker: 'BNDX', subcategories: { global: { name: '全球债券', assets: { EMBD: '新兴市场债', EUBD: '欧洲政府债', JPBD: '日本国债' } } }, sens: { fedRate: -0.35, realYield: -0.33, usd: -0.20, vix: 0.50, creditSpread: -0.15, globalGrowth: -0.30, cnPolicy: 0, yieldCurve: -0.3, inflation: -0.50, momentum: 0, adoption: 0, yieldCurve: -0.28, sofrOisSpread: 0.50, pmiDelta: -0.18, fedDotsGap: -0.20, ratePath: 0.5, vixTermStructure: -0.15, creditSpreadMomentum: 0.25 }, rec: { conservative: 0.20, balanced: 0.12, aggressive: 0.04 }, volatility: 0.06,
        etfMap: {
            primary: [
                { ticker: 'BNDX', name: 'Vanguard国际债', expense: '0.07%', note: '⭐ 系统基准标的。真正的非美全球债券' },
                { ticker: 'BWX', name: 'SPDR国际国债', expense: '0.35%', note: '非美政府债' },
                { ticker: 'EMB', name: '新兴市场美元债', expense: '0.39%', note: '新兴市场主权债' }
            ]
        }
    },
    // v8.27b: 商品拆分为4个独立大类（移除commodities大类）
    precious: {
        name: '🥇 贵金属', benchmarkTicker: 'GLD', subcategories: { metals: { name: '贵金属', assets: { GC: '黄金', SI: '白银', GOLD: '黄金SPDR', SILVER: '白银ETF' } } }, sens: { fedRate: -0.15, realYield: -0.43, usd: -0.75, vix: 0.80, creditSpread: 0.20, globalGrowth: -0.20, cnPolicy: 0.10, yieldCurve: -0.25, inflation: 0.40, momentum: 0.15, adoption: 0, yieldCurve: -0.20, sofrOisSpread: 0.40, pmiDelta: -0.10, fedDotsGap: 0.20, ratePath: 0.4, vixTermStructure: -0.3, creditSpreadMomentum: -0.25 }, rec: { conservative: 0.10, balanced: 0.08, aggressive: 0.05 }, volatility: 0.15,
        etfMap: {
            primary: [
                { ticker: 'GLD', name: 'SPDR黄金', expense: '0.40%', note: '全球最大黄金ETF' },
                { ticker: 'IAU', name: 'iShares黄金', expense: '0.25%', note: '低费率黄金替代' },
                { ticker: 'SLV', name: 'iShares白银', expense: '0.50%', note: '白银敞口' }
            ],
            domestic: [
                { ticker: '518880', name: '华安黄金ETF', expense: '0.15%', note: '境内最大黄金ETF' },
                { ticker: '518800', name: '国泰黄金ETF', expense: '0.15%', note: '活跃黄金品种' }
            ]
        }
    },
    energy: {
        name: '⛽ 能源', benchmarkTicker: 'XLE', subcategories: { fuels: { name: '能源', assets: { CL: 'WTI原油', NG: '天然气', OIL: '原油ETF', NATGAS: '天然气ETF' } } }, sens: { fedRate: -0.25, realYield: -0.20, usd: -0.60, vix: -0.50, creditSpread: -0.40, globalGrowth: 0.90, cnPolicy: 0.05, yieldCurve: 0.3, inflation: 0.85, momentum: 0.50, adoption: 0, yieldCurve: 0.30, sofrOisSpread: -0.50, pmiDelta: 0.70, fedDotsGap: 0.25, ratePath: -0.3, vixTermStructure: 0.45, creditSpreadMomentum: -0.3 }, rec: { conservative: 0.05, balanced: 0.10, aggressive: 0.15 }, volatility: 0.30,
        etfMap: {
            primary: [
                { ticker: 'XLE', name: 'SPDR能源板块', expense: '0.09%', note: '能源股票型，避免期货展期损耗' },
                { ticker: 'USO', name: 'WTI原油', expense: '0.60%', note: '直接原油敞口（注意展期成本）' },
                { ticker: 'UNG', name: '天然气', expense: '1.11%', note: '天然气（高费率）' }
            ]
        }
    },
    industrial: {
        name: '🏭 工业金属', benchmarkTicker: 'COPX', subcategories: { metals: { name: '工业金属', assets: { HG: '铜', LIT: '锂', COBALT: '钴', NI: '镍', COPPER: '铜ETF', ALUMINUM: '铝ETF' } } }, sens: { fedRate: -0.30, realYield: -0.28, usd: -0.55, vix: -0.40, creditSpread: -0.35, globalGrowth: 0.85, cnPolicy: 0.08, yieldCurve: 0.35, inflation: 0.50, momentum: 0.40, adoption: 0, yieldCurve: 0.35, sofrOisSpread: -0.55, pmiDelta: 0.80, fedDotsGap: 0.20, ratePath: -0.25, vixTermStructure: 0.4, creditSpreadMomentum: -0.25 }, rec: { conservative: 0.03, balanced: 0.05, aggressive: 0.08 }, volatility: 0.36, // v16.55 校准
        etfMap: {
            primary: [
                { ticker: 'COPX', name: '全球铜矿', expense: '0.65%', note: '铜矿股票型ETF' },
                { ticker: 'DBB', name: '基本金属', expense: '0.77%', note: '铝/铜/锌综合' },
                { ticker: 'LIT', name: '锂电池产业链', expense: '0.75%', note: '锂/电池新能源' }
            ]
        }
    },
    agriculture: {
        name: '🌾 农产品', benchmarkTicker: 'DBA', subcategories: { crops: { name: '农产品', assets: { DBC: '农产品指数', CORN: '玉米', WHEAT: '小麦', SOYB: '大豆', RARE: '稀土' } } }, sens: { fedRate: -0.20, realYield: -0.18, usd: -0.50, vix: -0.20, creditSpread: -0.25, globalGrowth: 0.60, cnPolicy: 0.05, yieldCurve: 0.2, inflation: 0.70, momentum: 0.30, adoption: 0, yieldCurve: 0.20, sofrOisSpread: -0.30, pmiDelta: 0.40, fedDotsGap: 0.10, ratePath: -0.15, vixTermStructure: 0.3, creditSpreadMomentum: -0.2 }, rec: { conservative: 0.02, balanced: 0.04, aggressive: 0.06 }, volatility: 0.12, // v16.55 校准
        etfMap: {
            primary: [
                { ticker: 'DBA', name: '综合农产品', expense: '0.85%', note: '農产品综合敞口' },
                { ticker: 'MOO', name: '农业股票', expense: '0.52%', note: '农业企业股票型' },
                { ticker: 'CORN', name: '玉米', expense: '0.75%' },
                { ticker: 'WEAT', name: '小麦', expense: '0.75%' }
            ]
        }
    },
    crypto: {
        name: '₿ 加密资产', benchmarkTicker: 'IBIT', subcategories: { major: { name: '主流币', assets: { BTC: 'BTC', ETH: 'ETH', SOL: 'SOL' } }, altcoins: { name: '其他币', assets: { XRP: 'XRP', DOGE: 'DOGE' } } }, sens: { fedRate: -0.38, realYield: -0.36, usd: -0.52, vix: -0.85, creditSpread: -0.65, globalGrowth: 0.65, cnPolicy: -0.48, yieldCurve: 0.3, inflation: 0.38, momentum: 0.92, adoption: 0.92, yieldCurve: 0.40, sofrOisSpread: -0.70, pmiDelta: 0.35, fedDotsGap: 0.40, ratePath: -0.5, vixTermStructure: 0.55, creditSpreadMomentum: -0.4 }, rec: { conservative: 0.01, balanced: 0.08, aggressive: 0.15 }, volatility: 0.65,
        etfMap: {
            primary: [
                { ticker: 'IBIT', name: '贝莱德比特币ETF', expense: '0.25%', note: '现货BTC，机构首选' },
                { ticker: 'ETHA', name: '贝莱德以太坊ETF', expense: '0.25%', note: '现货ETH' },
                { ticker: 'BITO', name: 'ProShares比特币期货', expense: '0.95%', note: '期货型（有展期损耗）' }
            ],
            note: '💡 加密资产也可直接在交易所购买现货（Coinbase/Binance），费用更低。'
        }
    },
    // v11.21: 外汇拆分为4个独立类别（不同货币特性）
    forex_major: {
        name: '💱 主流外币', benchmarkTicker: 'FXE', subcategories: { major: { name: '主流货币', assets: { EUR: '欧元/USD', GBP: '英镑/USD' } } }, sens: { fedRate: -0.25, realYield: -0.20, usd: -0.8, vix: 0.1, creditSpread: -0.1, globalGrowth: 0.3, cnPolicy: 0, yieldCurve: 0.15, inflation: 0.1, momentum: 0.2, adoption: 0, yieldCurve: 0.10, sofrOisSpread: 0.20, pmiDelta: 0.15, fedDotsGap: 0.10, ratePath: 0.2, vixTermStructure: 0.1, creditSpreadMomentum: 0.1 }, rec: { conservative: 0.02, balanced: 0.01, aggressive: 0.01 }, volatility: 0.08,
        etfMap: {
            primary: [
                { ticker: 'FXE', name: '欧元信托', expense: '0.40%', note: '做多欧元/做空美元' },
                { ticker: 'FXB', name: '英镑信托', expense: '0.40%', note: '做多英镑' },
                { ticker: 'UUP', name: '美元多头', expense: '0.75%', note: '做多美元（反向）' }
            ],
            note: '💡 外汇敞口也可通过外汇经纪商直接交易，点差通常低于ETF费率。'
        }
    },
    forex_safe: {
        name: '🛡️ 避险货币', benchmarkTicker: 'FXY', subcategories: { safe: { name: '避险货币', assets: { JPY: '日元/USD', CHF: '瑞郎/USD' } } }, sens: { fedRate: -0.15, realYield: -0.10, usd: -0.2, vix: 0.7, creditSpread: 0.3, globalGrowth: -0.2, cnPolicy: 0, yieldCurve: -0.25, inflation: -0.1, momentum: -0.3, adoption: 0, yieldCurve: -0.15, sofrOisSpread: 0.50, pmiDelta: -0.20, fedDotsGap: -0.15, ratePath: 0.35, vixTermStructure: -0.3, creditSpreadMomentum: 0.15 }, rec: { conservative: 0.02, balanced: 0.01, aggressive: 0.00 }, volatility: 0.10,
        etfMap: {
            primary: [
                { ticker: 'FXY', name: '日元信托', expense: '0.40%', note: '做多日元' },
                { ticker: 'FXF', name: '瑞郎信托', expense: '0.40%', note: '做多瑞郎' }
            ]
        }
    },
    forex_cny: {
        name: '🇨🇳 人民币', benchmarkTicker: null, subcategories: { cny: { name: '人民币', assets: { CNY: '人民币/USD' } } }, sens: { fedRate: -0.10, realYield: -0.08, usd: -0.3, vix: 0.2, creditSpread: -0.1, globalGrowth: 0.4, cnPolicy: 0.06, yieldCurve: 0.2, inflation: 0.1, momentum: 0.2, adoption: 0, yieldCurve: 0.10, sofrOisSpread: -0.20, pmiDelta: 0.25, fedDotsGap: 0.15, ratePath: -0.2, vixTermStructure: 0.25, creditSpreadMomentum: -0.15 }, rec: { conservative: 0.01, balanced: 0.01, aggressive: 0.01 }, volatility: 0.05,
        etfMap: {
            note: '⚠️ 无直接可交易ETF。人民币敞口通常通过持有中国股票/债券间接获取，或通过外汇账户直接交易 USD/CNH。'
        }
    },
    forex_commodity: {
        name: '🌾 商品货币', benchmarkTicker: 'FXA', subcategories: { commodity: { name: '商品货币', assets: { AUD: '澳元/USD', CAD: '加元/USD' } } }, sens: { fedRate: -0.20, realYield: -0.18, usd: -0.6, vix: -0.3, creditSpread: -0.3, globalGrowth: 0.6, cnPolicy: 0.02, yieldCurve: 0.25, inflation: 0.4, momentum: 0.3, adoption: 0, yieldCurve: 0.20, sofrOisSpread: -0.40, pmiDelta: 0.50, fedDotsGap: 0.20, ratePath: -0.3, vixTermStructure: 0.35, creditSpreadMomentum: -0.2 }, rec: { conservative: 0.00, balanced: 0.00, aggressive: 0.00 }, volatility: 0.12,
        etfMap: {
            primary: [
                { ticker: 'FXA', name: '澳元信托', expense: '0.40%', note: '做多澳元' },
                { ticker: 'FXC', name: '加元信托', expense: '0.40%', note: '做多加元' }
            ]
        }
    },
    hedges: {
        name: '🛡️ 对冲工具', benchmarkTicker: 'SHV', subcategories: { volatility: { name: '波动率', assets: { VIX: 'VIX恐慌指数', SVXY: '放空VIX' } }, cash: { name: '现金类', assets: { CASH: '美元现金(USD)', USDC: 'USDC稳定币', USDTBILL: '美元国库券(USD)' } }, relative: { name: '相对价值', assets: { AUSX: '黄金/SPX', PUTSPREAD: '波动率对冲' } } }, sens: { fedRate: 0.28, realYield: 0.25, usd: 0.15, vix: 0.85, creditSpread: 0.00, globalGrowth: 0.00, cnPolicy: 0.00, yieldCurve: -0.3, inflation: -0.30, momentum: 0, adoption: 0, yieldCurve: -0.10, sofrOisSpread: 0.60, pmiDelta: -0.25, fedDotsGap: -0.20, ratePath: 0.3, vixTermStructure: -0.5, creditSpreadMomentum: 0.2 }, rec: { conservative: 0.27, balanced: 0.13, aggressive: 0.04 }, volatility: 0.08,
        etfMap: {
            primary: [
                { ticker: 'SHV', name: '短期国债', expense: '0.15%', note: '现金等价物，近乎无风险' },
                { ticker: 'BIL', name: '1-3月国库券', expense: '0.14%', note: '超短期国债' },
                { ticker: 'SGOV', name: '0-3月国债', expense: '0.07%', note: '最低费率现金替代' }
            ],
            note: '💡 对冲/现金仓位也可直接持有货币市场基金或银行存款。'
        }
    }
};

/**
 * v16.57: 资产级交易冲击成本表 (单边, 含滑点+市场冲击)
 * 
 * 来源：基于各 benchmarkTicker 的平均日成交量和买卖价差估算
 * 分级逻辑:
 *   - Tier 1 (≤0.05%): SPY/QQQ/AGG 等超高流动性 ETF
 *   - Tier 2 (0.08-0.12%): 主要国家 ETF (ASHR/MCHI/EFA)
 *   - Tier 3 (0.15-0.20%): 商品 ETF (GLD/XLE)、外汇 ETF
 *   - Tier 4 (0.25-0.35%): 小众商品/新兴市场 (DBA/DBB/加密)
 * 
 * 总交易成本 = impactCost (单边) × 2 (双边) + stampDuty (如适用)
 * 用于 analyzeRebalancingCost() 和 updateRebalanceCost()
 */
const IMPACT_COST_MAP = {
    cnStock: 0.0012,  // ASHR: 中等流动性 + A股印花税
    hkStock: 0.0012,  // MCHI: 中等流动性
    usStock: 0.0005,  // SPY: 超高流动性 Tier 1
    devStock: 0.0008,  // EFA: 高流动性
    emStock: 0.0010,  // EEM: 中等流动性
    bonds_us: 0.0005,  // AGG: 超高流动性 Tier 1
    bonds_china: 0.0015,  // 中国债券 ETF 流动性较低
    bonds_global: 0.0010,  // BNDX: 中等流动性
    precious: 0.0008,  // GLD: 高流动性商品
    energy: 0.0015,  // XLE: 波动较大
    industrial: 0.0025,  // COPX/DBB: 小众商品 Tier 4
    agriculture: 0.0030,  // DBA: 最低流动性 Tier 4
    crypto: 0.0020,  // IBIT: 新兴但流动性快速上升
    forex_major: 0.0010,  // FXE: 中等
    forex_safe: 0.0012,  // FXY: 中等偏低
    forex_cny: 0.0020,  // 无 ETF, 外汇直接交易
    forex_commodity: 0.0015,  // FXA: 中等
    hedges: 0.0003   // SHV/BIL: 最高流动性现金等价物
};
// 将冲击成本表挂到 window 上供 UI 层读取
window.IMPACT_COST_MAP = IMPACT_COST_MAP;
/**
 * v11.35b: 资产诞生年份表
 * 用于历史场景过滤，只显示当时存在的资产类别
 */
const assetBirthYear = {
    // 传统资产（1900年前就存在）
    cnStock: 1990,        // A股1990年成立
    hkStock: 1990,        // 港股/海外中概ETF
    usStock: 1900,        // 美股很早
    devStock: 1900,       // 发达市场很早
    emStock: 1990,        // 新兴市场ETF 1990年代
    bonds_us: 1900,       // 美债
    bonds_china: 1990,    // 中国债市
    bonds_global: 1990,   // 全球债券ETF
    precious: 1900,       // 贵金属
    energy: 1900,         // 能源
    industrial: 1900,     // 工业金属
    agriculture: 1900,    // 农产品
    forex_major: 1900,    // 外汇
    forex_safe: 1900,
    forex_cny: 1994,      // 人民币汇率并轨1994年
    forex_commodity: 1900,
    hedges: 1990,         // VIX 1993年推出
    // 加密资产（2009年后）
    crypto: 2009          // Bitcoin 2009年1月3日创世区块
};

/**
 * v11.35b: 检查资产在指定场景年份是否存在
 * @param {string} assetKey - 资产键名
 * @param {number|null} scenarioYear - 场景年份，null表示当前环境
 * @returns {boolean} 资产是否存在
 */
function isAssetAvailable(assetKey, scenarioYear) {
    if (scenarioYear === null) return true;  // 当前环境，所有资产可用
    const birthYear = assetBirthYear[assetKey] || 1900;
    return scenarioYear >= birthYear;
}
window.isAssetAvailable = isAssetAvailable;


/**
 * v11.25 新增：宏观指标历史标准差数据表
 * 用于z-score偏离度计算，数据来源：2008-2024年历史数据分析
 * 研究文档：docs/02_Architecture/宏观指标标准差研究.md
 */
const macroStdDev = {
    // 核心9个指标（基于2000-2025全样本104季度FRED+YF数据，2026-04-07更新）
    fedRate: 2.02,        // Fed利率标准差 (旧1.80, +12%)
    realYield: 1.19,      // 10年TIPS实际收益率标准差 (旧0.90, +32%)
    usd: 11.30,           // 美元指数标准差 (旧5.20, +117% 🔴严重偏低)
    vix: 8.05,            // VIX恐慌指数标准差 (旧8.50, -5% ✅)
    creditSpread: 2.64,   // HY OAS信用利差标准差 (旧0.80, +230% 🔴最大偏差)
    globalGrowth: 1.20,   // 全球经济增速标准差
    cnPolicy: 0.06,       // 中国政策立场标准差
    yieldCurve: 0.80,     // G2: 10Y-2Y利差标准差 (基于FRED T10Y2Y 2000-2025数据)
    inflation: 0.54,      // 5Y Breakeven通胀标准差 (旧1.60, -66%)
    momentum: 0.20,       // 市场动量标准差
    // 其他指标（估算值）
    adoption: 0.15,
    btcCycle: 0.25,
    rateTrend: 0.40,
    growthTrend: 0.35,
    inflationTrend: 0.30,
    usdTrend: 0.30,
    cnPolicyTrend: 0.40,
    // v11.35 Phase 17: 领先指标标准差（估算值）
    sofrOisSpread: 15.0,   // SOFR-OIS利差标准差（bp），正常5-30bp
    pmiDelta: 1.5,         // PMI变化率标准差，正常±2
    fedDotsGap: 30.0,       // Fed预期偏离标准差（bp），正常±50bp
    // v16.67 Phase C: 新增前瞻信号 (2026-04-08)
    ratePath: 0.62,           // 2Y国债-Fed利率差值标准差，基于94个季度FRED数据
    vixTermStructure: 0.087,  // VIX3M/VIX 比率标准差，基于77个季度CBOE数据
    creditSpreadMomentum: 1.53 // 信用利差季度环比变化标准差，基于~98个季度FRED数据
};

// ===============================================
// v11.36 Phase 16: 概率化与多情景对冲系统
// ===============================================

/**
 * 情景参数模板：定义每个情景对基础宏观参数的覆盖
 * 用于生成不同情景下的完整宏观参数集
 */
const scenarioTemplates = {
    // 利率情景
    recession: {
        name: '衰退型降息',
        description: 'Fed被迫降息应对衰退，风险资产承压',
        overrides: {
            rateChangeReason: -1,
            vixReason: -0.7,
            momentum: -0.5
        },
        assetBias: { bonds: '+', stocks: '-', gold: '+' }
    },
    prevention: {
        name: '预防型降息',
        description: 'Fed主动降息维持扩张，利好风险资产',
        overrides: {
            rateChangeReason: 1,
            vixReason: 0,
            momentum: 0.3
        },
        assetBias: { bonds: '-', stocks: '+', gold: '=' }
    },
    neutral: {
        name: '中性/不确定',
        description: '宏观方向不明，维持平衡配置',
        overrides: {},
        assetBias: { all: '=' }
    },
    tightening: {
        name: '收紧期/加息',
        description: 'Fed加息应对过热，债券承压',
        overrides: {
            rateChangeReason: -0.5,
            vixReason: 0.5,
            momentum: 0.2
        },
        assetBias: { bonds: '--', stocks: '-', cash: '+' }
    },
    // 增长情景
    softLanding: {
        name: '软着陆',
        description: '经济放缓但避免衰退，股债均衡',
        overrides: {
            globalGrowth: 2.0,
            pmiDelta: -0.5,
            vixReason: 0
        },
        assetBias: { bonds: '=', stocks: '=', gold: '=' }
    },
    hardLanding: {
        name: '硬着陆',
        description: '经济陷入衰退，避险资产占优',
        overrides: {
            globalGrowth: -0.5,
            pmiDelta: -2,
            vixReason: -0.6,
            creditSpread: 4.0
        },
        assetBias: { bonds: '+', stocks: '-', gold: '+' }
    },
    reacceleration: {
        name: '再加速',
        description: '经济重新加速增长，周期股占优',
        overrides: {
            globalGrowth: 3.5,
            pmiDelta: 1.5,
            momentum: 0.7
        },
        assetBias: { bonds: '-', stocks: '+', commodities: '+' }
    },
    // 通胀情景
    stagflation: {
        name: '滞胀',
        description: '高通胀+低增长，商品占优',
        overrides: {
            inflation: 6.0,
            globalGrowth: 1.0,
            inflationReason: -1
        },
        assetBias: { bonds: '-', stocks: '-', commodities: '+', gold: '+' }
    },
    disinflation: {
        name: '通缩压力',
        description: '通胀回落，债券占优',
        overrides: {
            inflation: 1.5,
            inflationReason: 0.5
        },
        assetBias: { bonds: '+', stocks: '=', gold: '=' }
    },
    // 危机情景
    crisis: {
        name: '系统性危机',
        description: 'VIX>50，流动性枯竭',
        overrides: {
            vix: 55,
            vixReason: -1,
            creditSpread: 5.0,
            momentum: -1
        },
        assetBias: { bonds: '+', stocks: '-', gold: '+', cash: '+' }
    }
};


const macroIndics = {
    fedRate: {
        label: 'Fed利率 (%)',
        explain: '美联储联邦基金目标利率',
        current: 3.75,
        neutral: 3.5,
        range: [0, 10],  // v11.18: 扩展以适应历史极端（1980s高利率7.5%+）
        sourceLabel: 'FRED: FEDFUNDS',
        sourceUrl: 'https://fred.stlouisfed.org/series/FEDFUNDS'
    },
    realYield: {
        label: '🇺🇸 10年美债实际收益率',
        explain: '名义利率 - 通胀预期',
        current: 2.05,
        neutral: 1.5,
        range: [-8.0, 5.0],  // v11.18: 扩展以适应2022年(-6.79%)等极端
        sourceLabel: 'FRED: DFII10',
        sourceUrl: 'https://fred.stlouisfed.org/series/DFII10'
    },
    usd: {
        label: '美元指数 (DXY)',
        explain: '美元相对于一篮子货币强弱',
        current: 103.5,
        neutral: 100.0,
        range: [70, 130],  // v11.18: 扩展以适应2011年(87.39)等极端
        sourceLabel: 'TradingView: DXY',
        sourceUrl: 'https://www.tradingview.com/symbols/TVC-DXY/'
    },
    vix: {
        label: 'VIX恐慌指数',
        explain: '标普500隐含波动率',
        current: 14.45,
        neutral: 18.0,
        range: [8, 160],  // v11.18: 扩展以适应1987(150)、2008(59.89)、2020(82.69)
        sourceLabel: 'CBOE VIX',
        sourceUrl: 'https://www.cboe.com/tradable_products/vix/'
    },
    creditSpread: {
        label: '高收益债利差 (%)',
        explain: '美国高收益债 vs 国债利差 (ICE BofA HY Index)',
        current: 2.90,
        neutral: 3.5,
        range: [2.0, 8.0],
        sourceLabel: 'FRED: BAMLH0A0HYM2',
        sourceUrl: 'https://fred.stlouisfed.org/series/BAMLH0A0HYM2',
        guide: 'Dec 2025约2.9%。注意：BBB级利差约0.8%不是这个指标'
    },
    inflation: {
        label: '🇺🇸 通胀预期 (US 5Y Breakeven)',
        explain: '美国5年期盈亏平衡通胀率',
        current: 2.30,
        neutral: 2.0,
        range: [0, 12],  // v11.18: 扩展以适应2022年9%通胀
        sourceLabel: 'FRED: T5YIE',
        sourceUrl: 'https://fred.stlouisfed.org/series/T5YIE'
    },
    globalGrowth: {
        label: '全球增速 (%)',
        explain: 'IMF/WorldBank 全球GDP预测',
        current: 2.90,
        neutral: 3.0,
        range: [-5, 8],  // v11.18: 扩展以适应2020年-2.9%、以及高增长时期
        sourceLabel: 'IMF WEO Data',
        sourceUrl: 'https://www.imf.org/en/Publications/WEO',
        hardToFind: true,
        defaultVal: 2.9,
        defaultDesc: 'IMF预测'
    },
    yieldCurve: {
        label: '📉 收益率曲线 (10Y-2Y利差)',
        explain: '10年期国债 - 2年期国债利差。正值=正常, 负值=倒挂(衰退预警)',
        current: 0.50,
        neutral: 1.00,
        range: [-1.0, 3.0],
        sourceLabel: 'FRED: T10Y2Y',
        sourceUrl: 'https://fred.stlouisfed.org/series/T10Y2Y',
        guide: '倒挂(-0.5以下)历史上85%准确预测衰退'
    },
    yieldCurve: {
        label: '📉 收益率曲线 (10Y-2Y利差)',
        explain: '10年期国债 - 2年期国债利差。正值=正常, 负值=倒挂(衰退预警)',
        current: 0.50,
        neutral: 1.00,
        range: [-1.0, 3.0],
        sourceLabel: 'FRED: T10Y2Y',
        sourceUrl: 'https://fred.stlouisfed.org/series/T10Y2Y',
        guide: '倒挂(-0.5以下)历史上85%准确预测衰退。当前正值=无衰退信号'
    },
    cnPolicy: {
        label: '中国政策力度 (-1~1)',
        explain: '1=强刺激, -1=紧缩',
        current: 0.2,
        neutral: 0.0,
        range: [-1, 1],
        options: [
            { value: 1, label: '全面强刺激 (降息降准+财政万亿)' },
            { value: 0.8, label: '强力宽松 (显著放松地产/信贷)' },
            { value: 0.5, label: '积极支持 (政治局会议定调积极)' },
            { value: 0.2, label: '温和呵护 (定向降准/MLF操作)' },
            { value: 0, label: '中性观望 (无重大政策变动)' },
            { value: -0.3, label: '边际收紧 (去杠杆/监管加强)' },
            { value: -0.8, label: '显著紧缩 (全面加息/严控信贷)' }
        ],
        guide: '主观打分：政治局会议定调积极+0.5，降准降息+0.3',
        hardToFind: true,
        defaultVal: 0,
        defaultDesc: '中性观望'
    },
    momentum: {
        label: '🇺🇸 美股动量 (SPX Momentum)',
        explain: '标普500指数趋势：1=强劲上升, -1=下跌',
        current: 0.5,
        neutral: 0.0,
        range: [-1, 1],
        options: [
            { value: 1, label: '强劲牛市 (SPX > 50日 > 200日线 + 创新高)' },
            { value: 0.5, label: '温和上涨 (SPX > 200日线, 回调但不破位)' },
            { value: 0, label: '震荡/无方向 (均线纠缠)' },
            { value: -0.5, label: '弱势调整 (SPX < 50日线)' },
            { value: -0.8, label: '技术破位 (SPX < 200日线)' },
            { value: -1, label: '崩盘/熊市 (持续创新低)' }
        ],
        guide: '技术面：SPX > 200日线记+0.5, > 50日线记+0.5',
        hardToFind: true,
        defaultVal: 0,
        defaultDesc: '无明显趋势'
    },
    // v16.67 Phase C: 新增前瞻信号 (2026-04-08)
    ratePath: {
        label: '📉 利率路径预期 (2Y-Fed)',
        explain: '2年期国债收益率 - 联邦基金利率。正值=市场预期加息，负值=预期降息',
        current: -0.11,
        neutral: 0.0,
        range: [-2.5, 2.5],
        sourceLabel: 'FRED: DGS2 - FEDFUNDS',
        sourceUrl: 'https://fred.stlouisfed.org/series/DGS2'
    },
    vixTermStructure: {
        label: '📈 VIX期限结构 (VIX3M/VIX)',
        explain: 'VIX3M/VIX 比率。>1=正常(contango), <1=背开(backwardation=压力信号)',
        current: 1.05,
        neutral: 1.10,
        range: [0.6, 1.5],
        sourceLabel: 'CBOE: VIX3M / VIX',
        sourceUrl: 'https://www.cboe.com/tradable_products/vix/'
    },
    creditSpreadMomentum: {
        label: '📉 信用利差动量 (QoQ变化)',
        explain: '高收益债利差的季度环比变化。正值=利差扩大(风险上升)，负值=利差收窄',
        current: 0.0,
        neutral: 0.0,
        range: [-5, 10],
        sourceLabel: 'FRED: BAMLH0A0HYM2 QoQ Delta',
        sourceUrl: 'https://fred.stlouisfed.org/series/BAMLH0A0HYM2'
    },
    adoption: {
        label: '₿从新兴到主流 (Crypto/Asset Adoption)',
        explain: '加密资产或新科技资产的机构配置度',
        current: 0.6,
        neutral: 0.5,
        range: [0, 1],
        options: [
            { value: 0.1, label: '极低/边缘化 (仅散户参与)' },
            { value: 0.3, label: '早期尝试 (家族办公室少量配置)' },
            { value: 0.5, label: '中等认可 (对冲基金/企业配置)' },
            { value: 0.8, label: '主流接纳 (现货ETF获批/养老金入市)' },
            { value: 1.0, label: '货币化/标配 (成为央行储备或全球支付)' }
        ],
        guide: '主观：是否有ETF获批(0.5)，大型养老金入市(0.8)',
        hardToFind: true,
        defaultVal: 0.5,
        defaultDesc: '一般'
    },

    growthTrend: {
        label: '🌍 全球经济增速趋势 (Global Growth Trend)',
        explain: '+1=加速, -1=减速 (主要关注OECD/Global PMI)',
        current: 0.2,
        neutral: 0.0,
        range: [-1, 1],
        options: [
            { value: 1, label: '强劲复苏 / 过热 (>55)' },
            { value: 0.5, label: '温和扩张 (50-55)' },
            { value: 0, label: '稳定 (约50)' },
            { value: -0.5, label: '放缓 / 软着陆预期' },
            { value: -1, label: '衰退 / 硬着陆预期' }
        ],
        guide: 'Global PMI > 50记正值', hardToFind: true, defaultVal: 0, defaultDesc: '稳定'
    },
    inflationTrend: {
        label: '🇺🇸 通胀趋势 (US Inflation Trend)',
        explain: '美国CPI/PCE趋势: +1=上升, -1=下降',
        current: -0.2,
        neutral: 0.0,
        range: [-1, 1],
        options: [
            { value: 1, label: '通胀失控 / 二次通胀' },
            { value: 0.5, label: '通胀温和上升' },
            { value: 0, label: '通胀稳定' },
            { value: -0.5, label: '通胀回落 / 去通胀' },
            { value: -1, label: '通缩螺旋' }
        ],
        guide: 'US CPI环比下降记负值', hardToFind: true, defaultVal: 0, defaultDesc: '稳定'
    },
    usdTrend: {
        label: '美元趋势 (-1~1)',
        explain: '+1=走强, -1=走弱',
        current: 0.1,
        neutral: 0.0,
        range: [-1, 1],
        options: [
            { value: 1, label: '强劲上涨 (突破并站稳均线)' },
            { value: 0.5, label: '温和反弹' },
            { value: 0, label: '震荡整理' },
            { value: -0.5, label: '承压回落' },
            { value: -1, label: '破位下跌' }
        ],
        guide: 'DXY在均线上记正值', hardToFind: true, defaultVal: 0, defaultDesc: '横盘'
    },
    cnPolicyTrend: {
        label: '中国政策趋势 (-1~1)',
        explain: '+1=趋于宽松, -1=趋于收紧',
        current: 0.3,
        neutral: 0.0,
        range: [-1, 1],
        options: [
            { value: 1, label: '全面宽松周期' },
            { value: 0.5, label: '边际转松' },
            { value: 0, label: '政策定力 / 观察期' },
            { value: -0.5, label: '边际收紧' },
            { value: -1, label: '去杠杆 / 紧缩周期' }
        ],
        guide: '预期刺激政策记正值', hardToFind: true, defaultVal: 0, defaultDesc: '维持'
    },
    cnGrowthTrend: {
        label: '🇨🇳 中国增长动能 (-1~1)',
        explain: '中国经济增长动能 (PMI/GDP/消费) 变化',
        current: 0,
        neutral: 0.0,
        range: [-1, 1],
        options: [
            { value: 1, label: '强劲复苏 (PMI > 52)' },
            { value: 0.5, label: '温和回升 (PMI > 50)' },
            { value: 0, label: '企稳/磨底' },
            { value: -0.5, label: '动能减弱 (PMI < 50)' },
            { value: -1, label: '深度下滑 (PMI < 48)' }
        ],
        guide: 'Caixin/Official PMI Trend', hardToFind: true, defaultVal: 0, defaultDesc: '企稳'
    },
    cnCreditImpulse: {
        label: '🇨🇳 中国信贷脉冲 (-1~1)',
        explain: '社融增量 (TSF) 同比变化，领先指标',
        current: 0,
        neutral: 0.0,
        range: [-1, 1],
        options: [
            { value: 1, label: '信贷狂潮 (M1/M2剪刀差收窄)' },
            { value: 0.5, label: '信贷扩张 (社融超预期)' },
            { value: 0, label: '信贷平稳' },
            { value: -0.5, label: '信贷收缩 (社融不及预期)' },
            { value: -1, label: '紧信用 (去杠杆)' }
        ],
        guide: 'Credit Impulse Lead Economy 6-9 months', hardToFind: true, defaultVal: 0, defaultDesc: '平稳'
    },
    // === v16.24: Global Asset Trends ===
    euEcoTrend: {
        label: '🇪🇺 欧洲经济趋势 (-1~1)',
        explain: '欧元区经济动能 (PMI/Sentiment)',
        current: 0,
        neutral: 0.0,
        range: [-1, 1],
        options: [
            { value: 1, label: '强劲复苏 (PMI>55)' },
            { value: 0.5, label: '温和改善 (PMI>50)' },
            { value: 0, label: '停滞/震荡' },
            { value: -0.5, label: '放缓 (PMI<50)' },
            { value: -1, label: '深度衰退 (能源危机/去工业化)' }
        ],
        guide: 'Eurozone Composite PMI Trend', hardToFind: true, defaultVal: 0
    },
    jpPolicyTrend: {
        label: '🇯🇵 日本央行趋势 (-1~1)',
        explain: 'BoJ货币政策方向 (YCC/加息)',
        current: -0.5,
        neutral: 0.0,
        range: [-1, 1],
        options: [
            { value: 1, label: '极度宽松 (负利率/YCC维持)' },
            { value: 0.5, label: '维持宽松 (鸽派表态)' },
            { value: 0, label: '观察期' },
            { value: -0.5, label: '货币正常化 (取消YCC/小幅加息)' },
            { value: -1, label: '鹰派紧缩 (连续加息/缩表)' }
        ],
        guide: 'BoJ Policy: Dovish(+) vs Hawkish(-)', hardToFind: true, defaultVal: 0
    },
    emFinancialTrend: {
        label: '🚀 新兴市场金融条件 (-1~1)',
        explain: 'EM货币/信贷宽松程度',
        current: 0,
        neutral: 0.0,
        range: [-1, 1],
        options: [
            { value: 1, label: '极度宽松 (降息+资本流入)' },
            { value: 0.5, label: '温和宽松' },
            { value: 0, label: '中性' },
            { value: -0.5, label: '收紧 (加息/资本外流)' },
            { value: -1, label: '流动性危机 (货币崩盘)' }
        ],
        guide: 'EM Financial Conditions Index', hardToFind: true, defaultVal: 0
    },
    commodityTrend: {
        label: '🛢️ 商品综指趋势 (CRB/GSCI)',
        explain: '全球大宗商品指数 (CRB/GSCI) 趋势',
        current: 0,
        neutral: 0.0,
        range: [-1, 1],
        options: [
            { value: 1, label: '超级牛市 (通胀交易)' },
            { value: 0.5, label: '温和上涨' },
            { value: 0, label: '震荡' },
            { value: -0.5, label: '承压下跌' },
            { value: -1, label: '崩盘 (通缩交易)' }
        ],
        guide: 'CRB Index Trend', hardToFind: true, defaultVal: 0, defaultDesc: '震荡'
    },
    goldTrend: {
        label: '🥇 黄金趋势 (-1~1)',
        explain: '黄金价格动量与实际利率偏离度',
        current: 0.5,
        neutral: 0.0,
        range: [-1, 1],
        options: [
            { value: 1, label: '主升浪 (突破历史新高)' },
            { value: 0.5, label: '上升趋势' },
            { value: 0, label: '高位震荡' },
            { value: -0.5, label: '回调' },
            { value: -1, label: '熊市开启' }
        ],
        guide: 'Price > MA200 & Making Highs', hardToFind: true, defaultVal: 0, defaultDesc: '震荡'
    },
    btcCycle: {
        label: 'BTC减半周期 (0~1)',
        explain: '0.2=熊市底, 0.8=牛市期',
        current: 0.5,
        neutral: 0.5,
        range: [0, 1],
        options: [
            { value: 0.2, label: '极度恐慌 / 历史底部区域' },
            { value: 0.4, label: '筑底震荡期' },
            { value: 0.5, label: '减半前后 / 中性' },
            { value: 0.75, label: '减半后扩张期 (牛市主升)' },
            { value: 0.9, label: '极度狂热 / 周期顶部' },
        ],
        guide: '2024年4月减半后=牛市扩张', hardToFind: true, defaultVal: 0.5, defaultDesc: '周期中性'
    },
    // === v8.19 新增：经济周期指标（已修正） ===
    usPmi: {
        label: '🇺🇸 美国制造业PMI (ISM)',
        explain: '>50扩张, <50收缩，美国制造业健康度',
        current: 48.2,
        neutral: 50.0,
        range: [40, 60],
        sourceLabel: 'ISM官网 / TradingEconomics',
        sourceUrl: 'https://tradingeconomics.com/united-states/business-confidence',
        guide: '每月第一个工作日公布。Nov 2025 = 48.2%'
    },
    usUnemployment: {
        label: '美国失业率 (%)',
        explain: '美国失业率百分比',
        current: 4.4,
        neutral: 4.5,
        range: [3.0, 8.0],
        sourceLabel: 'BLS via FRED: UNRATE',
        sourceUrl: 'https://fred.stlouisfed.org/series/UNRATE',
        guide: 'Sep 2025 = 4.4%，每月公布'
    },
    cnPmi: {
        label: '🇨🇳 中国官方制造业PMI (NBS官方)',
        explain: '>50扩张, <50收缩 (国家统计局数据, 区别于财新PMI)',
        current: 50.1,
        neutral: 50.0,
        range: [45, 55],
        sourceLabel: '国家统计局 / TradingEconomics',
        sourceUrl: 'https://tradingeconomics.com/china/manufacturing-pmi',
        guide: '国家统计局每月公布'
    },
    usGdpGrowth: {
        label: '美国GDP增速 (%)',
        explain: '美国实际GDP年化季度增速',
        current: 2.8,
        neutral: 2.0,
        range: [-2.0, 5.0],
        sourceLabel: 'BEA via FRED: GDP',
        sourceUrl: 'https://fred.stlouisfed.org/series/A191RL1Q225SBEA',
        guide: 'Q3 2025 初值 = 2.8%'
    },
    usCycleStage: {
        label: '美国经济周期 (自动)',
        explain: '根据PMI和失业率自动计算：-1衰退, 0减速, 0.5稳定, 1扩张',
        current: 0.3,
        neutral: 0.5,
        range: [-1, 1],
        guide: '【自动计算】基于公式: PMI<50且失业率>5%=-1; PMI>50且失业率<4%=1',
        hardToFind: true,
        autoCalc: true
    },
    // === v8.20 原因指标（可选，动态调整敏感度）===
    rateChangeReason: {
        label: '💡 🇺🇸 Fed利率变化原因 (US Rate Reason)',
        explain: '当前Fed利率变化的背景原因',
        isReason: true,
        current: 0,
        neutral: 0,
        range: [-1, 1],
        options: [
            { value: 0, label: '中性/不确定' },
            { value: 1, label: '预防型降息（Fed主动，利好股票）' },
            { value: -1, label: '衰退型降息（Fed被迫，利空股票）' },
            { value: -0.8, label: '极速加息（流动性冲击，利空全资产）' },
            { value: -0.5, label: '通胀恐慌加息（利空债券/股票）' },
            { value: -0.3, label: '开始转向/预期放缓（鸽派信号）' },
            { value: 0.5, label: '正常化加息（经济过热，中性偏空）' },
            { value: 0.7, label: '强力持续加息（抑制经济过度繁荣）' },
            { value: 0.8, label: '历史级激进加息（对抗高通胀，股债双杀）' }
        ],
        guide: '降息看原因：预防=利好 | 衰退=利空 | 加息看背景'
    },
    usdReason: {
        label: '美元相对外币强弱',  // v11.5: 更清晰的描述
        explain: 'USD指数相对其他货币的走势',
        isReason: true,
        current: 0,
        neutral: 0,
        range: [-1, 1],
        options: [
            { value: -1, label: '美元升值（压制外币/新兴市场，但不代表现金有吸引力）' },
            { value: -0.8, label: '美元强劲升值（避险需求，新兴市场承压）' },
            { value: -0.5, label: '美元温和升值（利好美元计价资产）' },
            { value: -0.3, label: '美元小幅升值（轻微避险）' },
            { value: -0.2, label: '美元微升（技术性调整）' },
            { value: 0, label: '美元中性' },
            { value: 0.5, label: '美元温和贬值（利好外币/新兴市场/大宗商品）' },
            { value: 0.7, label: '美元显著贬值（商品牛市，资金流向新兴市场）' },
            { value: 1, label: '美元大幅贬值（新兴市场/商品全面受益）' }
        ],
        guide: '美元走强分避险/经济 | 走弱分政策/风险偏好'
    },
    vixReason: {
        label: '💡 VIX变化原因',
        explain: 'VIX变化驱动因素',
        isReason: true,
        current: 0,
        neutral: 0,
        range: [-1, 1],
        options: [
            { value: 0, label: '中性/正常波动（15-20）' },
            { value: -1, label: '系统性危机（银行/主权，持续数月）' },
            { value: -0.7, label: '严重市场冲击（区域性危机扩散）' },
            { value: -0.6, label: '重大事件风险（银行/金融体系压力）' },
            { value: -0.5, label: '事件冲击（地缘/政策，持续数周）' },
            { value: 0.5, label: '技术调整（超买回调，持续数日）' },
            { value: 0.8, label: '异常低迷（VIX<12，过度乐观警告）' }
        ],
        guide: '系统危机>事件冲击>技术调整 | 低VIX也需警惕'
    },
    inflationReason: {
        label: '💡 🇺🇸 通胀变化原因 (US Inflation Reason)',
        explain: '美国通胀变化驱动因素 (供给/需求)',
        isReason: true,
        current: 0,
        neutral: 0,
        range: [-1, 1],
        options: [
            { value: 0, label: '中性/平衡' },
            { value: 1, label: '需求拉动 (Demand Pull) - 经济过热' },
            { value: -1, label: '供给冲击 (Cost Push) - 能源/供应链' },
            { value: 0.5, label: '工资螺旋 (Wage Price Spiral)' },
            { value: -0.5, label: '技术性回落 (Base Effect)' }
        ],
        guide: '区分供给端(负面)与需求端(正面)因素'
    },

    // === v14.0 Phase 18: 趋势因子 (Trend Factors) ===
    rateTrend: {
        label: '📉 🇺🇸 Fed利率趋势 (Fed Rate Trend)',
        explain: '全球/美国基准利率变动预期',
        isReason: true,
        current: 0,
        neutral: 0,
        range: [-2, 2],
        options: [
            { value: 2, label: 'Hike++: 激进加息 (+50/75bp)' },
            { value: 1, label: 'Hike+: 温和加息 (+25bp)' },
            { value: 0.5, label: 'Hike: 鹰派维持 (Higher for Longer)' },
            { value: 0, label: 'Neutral: 政策稳定' },
            { value: -0.2, label: 'Cut-: 鸽派维持 (预期降息)' },
            { value: -0.5, label: 'Cut: 预防性降息 (软着陆)' },
            { value: -1, label: 'Cut+: 衰退性降息 (硬着陆)' },
            { value: -1.5, label: 'Cut++: 危机救市 (零利率/QE)' },
        ],
        guide: '区分预防性(牛市)与衰退性(熊市)降息'
    },
    growthMomentum: {
        label: '🚀 增长动能 (US Growth Momentum)',
        explain: '美国短期经济增长动能 (PMI/GDP) 变化',
        isReason: true,
        current: 0,
        neutral: 0,
        range: [-2, 2],
        options: [
            { value: 1, label: 'Accelerating: 强劲加速 (>55)' },
            { value: 0.5, label: 'Recovering: 温和复苏 (50-55)' },
            { value: 0, label: 'Stable: 稳定 (约50)' },
            { value: -0.2, label: 'Slowing: 增速放缓 (依然扩张)' },
            { value: -0.5, label: 'Contracting: 温和收缩 (45-50)' },
            { value: -1, label: 'Plunging: 深度衰退 (<45)' },
        ],
        guide: '关注环比变化斜率 (Delta)'
    },
    // === v11.35 Phase 17: 领先指标 ===
    sofrOisSpread: {
        label: 'SOFR-OIS利差 (bp)',
        explain: 'SOFR - OIS利率，银行间信用风险前兆（替代已弃用的TED Spread）',
        current: 5,
        neutral: 5,
        range: [0, 100],
        sourceLabel: 'FRED: SOFR',
        sourceUrl: 'https://fred.stlouisfed.org/series/SOFR',
        guide: '正常0-10bp | >20bp=信贷紧张 | >50bp=危机预警',
        leadingIndicator: true
    },
    pmiDelta: {
        label: '🇺🇸 PMI变化率 (US ISM MoM)',
        explain: '当月PMI - 上月PMI (主要关注美国ISM)',
        current: 0,
        neutral: 0,
        range: [-5, 5],
        guide: '>+2=扩张加速 | <-2=收缩加速 | 连续3月负值=衰退预警',
        hardToFind: true,
        defaultVal: 0,
        defaultDesc: '稳定',
        leadingIndicator: true
    },
    fedDotsGap: {
        label: '🏦 Fed预期差 (市场 vs 点阵图)',
        explain: '市场定价(Futures)与美联储指引(Dot Plot)的基点偏差',
        current: 0,
        neutral: 0,
        range: [-100, 100],
        guide: '正值=市场认为Fed太鹰 | 负值=市场认为Fed太鸽 | 区别于"利率趋势"(方向)，这是"定价偏差"',
        hardToFind: true,
        defaultVal: 0,
        defaultDesc: '与Fed一致',
        leadingIndicator: true
    },
    // === v16.21: Valuation & Recession Triggers (P0.1/P1.6) ===
    spPE: {
        label: '📉 S&P 500 P/E',
        explain: '标普500市盈率 (Shiller PE or TTM)',
        current: 28.0,
        neutral: 20.0,
        range: [10, 40],
        sourceLabel: 'Multpl S&P 500 PE Ratio',
        sourceUrl: 'https://www.multpl.com/s-p-500-pe-ratio',
        lastUpdated: '2026-03-18',
        guide: '>28=泡沫 | <12=底部',
        hardToFind: false,
        defaultVal: 20.0
    },
    spPercentile: {
        label: '📉 S&P 500 估值分位 (0-100)',
        explain: '当前市盈率(P/E)在历史数据中的百分位值',
        current: 85,
        neutral: 50,
        range: [0, 100],
        sourceLabel: 'CurrentMarketValuation',
        sourceUrl: 'https://www.currentmarketvaluation.com/models/price-earnings.php',
        lastUpdated: '2026-03-18',
        guide: '>80=历史高估区间 | <20=历史低估区间',
        hardToFind: false,
        defaultVal: 50
    },
    // v16.38: 新增估值参数定义 (与 HTML Tab 0 估值面板对应)
    goldPriceMA200: {
        label: '🥇 黄金价格/200日均线',
        explain: '黄金当前价格相对于200日移动平均线的比值',
        current: 1.0,
        neutral: 1.0,
        range: [0.7, 1.6],
        sourceLabel: 'TradingView XAUUSD',
        sourceUrl: 'https://www.tradingview.com/symbols/XAUUSD/',
        lastUpdated: '2026-03-18',
        guide: '>1.15=超买 | <0.85=超卖 | 添加MA200指标查看',
        hardToFind: false,
        defaultVal: 1.0
    },
    oilPriceMA200: {
        label: '🛢️ 原油价格/200日均线',
        explain: 'WTI原油当前价格相对于200日移动平均线的比值',
        current: 1.0,
        neutral: 1.0,
        range: [0.5, 2.0],
        sourceLabel: 'TradingView CL1!',
        sourceUrl: 'https://www.tradingview.com/symbols/NYMEX-CL1!/',
        lastUpdated: '2026-03-18',
        guide: '>1.3=超买 | <0.7=超卖',
        hardToFind: false,
        defaultVal: 1.0
    },
    bondYieldTrend: {
        label: '💵 利率趋势 (bp, 6月变化)',
        explain: '10年期国债收益率过去6个月的变化(基点)',
        current: 0,
        neutral: 0,
        range: [-100, 100],
        sourceLabel: 'FRED DGS10',
        sourceUrl: 'https://fred.stlouisfed.org/series/DGS10',
        guide: '+值=升息期 | >50急升 | <-50急降',
        hardToFind: false,
        defaultVal: 0
    },
    bondRealYieldLevel: {
        label: '💵 实际收益率 (%)',
        explain: 'TIPS 10年期实际收益率',
        current: 2.0,
        neutral: 1.5,
        range: [-1, 4],
        sourceLabel: 'FRED DFII10',
        sourceUrl: 'https://fred.stlouisfed.org/series/DFII10',
        guide: '>2.5%=债券高吸引力 | <0=债券低吸引力',
        hardToFind: false,
        defaultVal: 1.5
    },
    commodity6mReturn: {
        label: '🛢️ 商品指数涨幅 (%)',
        explain: 'CRB/GSCI商品指数过去6个月涨跌幅',
        current: 0,
        neutral: 0,
        range: [-50, 50],
        sourceLabel: 'TradingView CRB',
        sourceUrl: 'https://www.tradingview.com/symbols/CRB/',
        guide: '>30%=动量过热 | <-30%=超跌',
        hardToFind: false,
        defaultVal: 0
    },
    sp6mReturn: {
        label: '📈 S&P 500 半年涨幅 (%)',
        explain: '标普500指数过去6个月涨跌幅',
        current: 0,
        neutral: 0,
        range: [-50, 50],
        sourceLabel: 'Yahoo Finance SPY',
        sourceUrl: 'https://finance.yahoo.com/quote/SPY/',
        guide: '>30%=过热 | <-20%=恐慌',
        hardToFind: false,
        defaultVal: 0
    },

    pmiConsecutive: {
        label: '📉 美国PMI连续衰退月数 (US ISM < 50)',
        explain: 'ISM制造业PMI连续低于50的月数 (衰退计数器)',
        current: 0,
        neutral: 0,
        range: [0, 12],
        guide: '输入连续月数计数: 0=非衰退/首次收缩 | 1=连续1个月<50 | 3=连续3个月(衰退预警)',
        hardToFind: true, // Auto-calculated usually
        defaultVal: 0,
        autoCalc: false
    },
    // v13.8.7 New System Parameters (Gold/Geopolitics Drivers)
    centralBankDemand: {
        label: '🏦 央行购金力度 (-1~1)',
        explain: '1=强力购入/去美元化, 0=中性, -1=抛售黄金',
        current: 0.5, // Default active buying in current era
        neutral: 0.0,
        range: [-1, 1],
        options: [
            { value: 1, label: '强力购入 (去美元化成主流)' },
            { value: 0.8, label: '显著增持 (央行买盘创历史)' },
            { value: 0.5, label: '温和增持 (正常配置需求)' },
            { value: 0, label: '中性/不持有' },
            { value: -0.5, label: '净抛售 (流动性变现需求)' }
        ],
        guide: '2022年后央行购金持续创新高，建议保持正值',
        hardToFind: true,
        defaultVal: 0
    },
    geoRisk: {
        label: '🌍 地缘战争风险 (0~1)',
        explain: '1=世界大战风险, 0.5=局部冲突, 0=和平',
        current: 0.4, // Elevated risk
        neutral: 0.0,
        range: [0, 1],
        options: [
            { value: 0, label: '和平 (全球合作)' },
            { value: 0.2, label: '摩擦 (贸易战/口头威胁)' },
            { value: 0.4, label: '紧张 (代理人战争/制裁)' },
            { value: 0.6, label: '局部战争 (主要产油/芯片国卷入)' },
            { value: 0.8, label: '大规模冲突 (大国直接对抗)' },
            { value: 1.0, label: '世界大战风险 (核威胁)' }
        ],
        guide: '注意区别于VIX。VIX是市场波动，这是政治/军事风险',
        hardToFind: true,
        defaultVal: 0
    },
    usDebtStability: {
        label: '🇺🇸 美债/美元信誉 (-1~1)',
        explain: '1=绝对避险港湾, 0=正常, -1=美债信任危机',
        current: -0.2, // Slight concern
        neutral: 0.0,
        range: [-1, 1],
        options: [
            { value: 1, label: '绝对避险港湾 (危机时唯一的安全资产)' },
            { value: 0, label: '正常机制 (无违约风险)' },
            { value: -0.2, label: '轻微担忧 (债务上限闹剧)' },
            { value: -0.5, label: '信用降级 (评级机构下调)' },
            { value: -0.8, label: '严重信任危机 (拍卖流拍)' },
            { value: -1, label: '违约风险 (实质性支付困难)' }
        ],
        guide: '如果出现美债流拍或降级，设为负值',
        hardToFind: true,
        defaultVal: 0
    }
};

/**
 * v11.35b: 场景年份映射表
 * 用于确定加载历史场景时的年份，以便过滤尚未存在的资产
 */
// v16.5 FIX: Expose globally on window to ensure ui.js can access it reliably
window.snapshotYears = {
    blackMonday1987: 1987,
    asianCrisis1997: 1997,
    dotcom2000: 2000,
    fedEasing2001: 2001,
    crisis2008: 2008,
    euroDebt2011: 2011,
    stimulus2012: 2012,
    chinacrash2015: 2015,
    period2016: 2016,
    period2017: 2017,
    tradeWar2018: 2018,
    period2019: 2019,
    covid2020: 2020,
    period2021: 2021,
    rateHike2022: 2022,
    period2023: 2023,
    period2024: 2024,
    period2025: 2025,
    bankCrisis2023: 2023
};

// 全局变量：当前场景年份（null表示当前环境，无时间限制）
// v16.4 FIX: Must be on window to match P1 check
window.currentScenarioYear = null;
// v16.64 P0 FIX: 历史Override 与年份可用性拆分
// live 模式不应因默认年份触发"上帝视角"修正
window._historicalOverrideMode = false;
window.getScenarioYearContext = function () {
    const rawYear = (typeof window.currentScenarioYear !== 'undefined' && window.currentScenarioYear !== null)
        ? window.currentScenarioYear
        : (window._currentScenario && window._currentScenario.year !== undefined ? window._currentScenario.year : null);
    const parsedYear = parseInt(rawYear, 10);
    return Number.isFinite(parsedYear) ? parsedYear : null;
};
window.isHistoricalOverrideMode = function () {
    return window._historicalOverrideMode === true;
};

// v16.5 FIX: Expose globally on window to ensure ui.js iteration works reliably
window.historicalSnapshots = {
  "quarterly_2000_q1": {
    "period": "2000-Q1",
    "description": "连续季度数据 2000-Q1",
    "quality": "C",
    "macroData": {
      "usd": 105.44,
      "vix": 24.11,
      "cnPolicy": 0.0,
      "cnPolicyTrend": 0.0,
      "momentum": 0.8,
      "adoption": 0.1,
      "btcCycle": 0.3,
      "rateChangeReason": 0.0,
      "usdReason": 0.0,
      "vixReason": 0.0,
      "inflationReason": 0.0,
      "globalGrowth": 3.0,
      "growthTrend": 0.0,
      "inflationTrend": 0.0,
      "usdTrend": 0.0,
      "realYield": 3.99,
      "fedRate": 6.02,
      "creditSpread": 5.78,
      "ratePath": 0.33
    },
    "actualReturns": {
      "usStock": 0.0858,
      "precious": -0.1101,
      "energy": 0.0316,
      "hedges": 0.0878
    },
    "dataSource": "FRED + Yahoo Finance (Auto)",
    "macroSources": {
      "usd": "Yahoo Finance",
      "vix": "Yahoo Finance",
      "realYield": "YF:^TNX-2.0(est)",
      "fedRate": "FRED:FEDFUNDS",
      "creditSpread": "FRED:BAMLH0A0HYM2",
      "ratePath": "FRED: DGS2 - FEDFUNDS"
    },
    "returnSources": {
      "usStock": "ETF:SPY",
      "precious": "Proxy:^XAU",
      "energy": "ETF:XLE",
      "hedges": "Proxy:^IRX"
    }
  },
  "quarterly_2000_q2": {
    "period": "2000-Q2",
    "description": "连续季度数据 2000-Q2",
    "quality": "C",
    "macroData": {
      "usd": 106.84,
      "vix": 19.54,
      "cnPolicy": 0.0,
      "cnPolicyTrend": 0.0,
      "momentum": -0.5,
      "adoption": 0.1,
      "btcCycle": 0.3,
      "rateChangeReason": 0.0,
      "usdReason": 0.0,
      "vixReason": 0.0,
      "inflationReason": 0.0,
      "globalGrowth": 3.0,
      "growthTrend": 0.0,
      "inflationTrend": 0.0,
      "usdTrend": 0.0,
      "realYield": 3.98,
      "fedRate": 6.54,
      "creditSpread": 6.2,
      "ratePath": -0.25,
      "creditSpreadMomentum": 0.42
    },
    "actualReturns": {
      "usStock": -0.0367,
      "precious": -0.0409,
      "energy": 0.0032,
      "hedges": 0.0175
    },
    "dataSource": "FRED + Yahoo Finance (Auto)",
    "macroSources": {
      "usd": "Yahoo Finance",
      "vix": "Yahoo Finance",
      "realYield": "YF:^TNX-2.0(est)",
      "fedRate": "FRED:FEDFUNDS",
      "creditSpread": "FRED:BAMLH0A0HYM2",
      "ratePath": "FRED: DGS2 - FEDFUNDS",
      "creditSpreadMomentum": "Calculated: QoQ delta of BAMLH0A0HYM2"
    },
    "returnSources": {
      "usStock": "ETF:SPY",
      "precious": "Proxy:^XAU",
      "energy": "ETF:XLE",
      "hedges": "Proxy:^IRX"
    }
  },
  "quarterly_2000_q3": {
    "period": "2000-Q3",
    "description": "连续季度数据 2000-Q3",
    "quality": "C",
    "macroData": {
      "usd": 113.25,
      "vix": 20.57,
      "cnPolicy": 0.0,
      "cnPolicyTrend": 0.0,
      "momentum": 0.0,
      "adoption": 0.1,
      "btcCycle": 0.3,
      "rateChangeReason": 0.0,
      "usdReason": 0.0,
      "vixReason": 0.0,
      "inflationReason": 0.0,
      "globalGrowth": 3.0,
      "growthTrend": 0.0,
      "inflationTrend": 0.0,
      "usdTrend": 0.0,
      "realYield": 3.87,
      "fedRate": 6.51,
      "creditSpread": 6.74,
      "ratePath": -0.49,
      "creditSpreadMomentum": 0.54
    },
    "actualReturns": {
      "usStock": -0.0082,
      "precious": -0.1496,
      "energy": 0.1004,
      "hedges": 0.036
    },
    "dataSource": "FRED + Yahoo Finance (Auto)",
    "macroSources": {
      "usd": "Yahoo Finance",
      "vix": "Yahoo Finance",
      "realYield": "YF:^TNX-2.0(est)",
      "fedRate": "FRED:FEDFUNDS",
      "creditSpread": "FRED:BAMLH0A0HYM2",
      "ratePath": "FRED: DGS2 - FEDFUNDS",
      "creditSpreadMomentum": "Calculated: QoQ delta of BAMLH0A0HYM2"
    },
    "returnSources": {
      "usStock": "ETF:SPY",
      "precious": "Proxy:^XAU",
      "energy": "ETF:XLE",
      "hedges": "Proxy:^IRX"
    }
  },
  "quarterly_2000_q4": {
    "period": "2000-Q4",
    "description": "连续季度数据 2000-Q4",
    "quality": "C",
    "macroData": {
      "usd": 109.56,
      "vix": 26.85,
      "cnPolicy": 0.0,
      "cnPolicyTrend": 0.0,
      "momentum": -0.8,
      "adoption": 0.1,
      "btcCycle": 0.3,
      "rateChangeReason": 0.0,
      "usdReason": 0.0,
      "vixReason": 0.0,
      "inflationReason": 0.0,
      "globalGrowth": 3.0,
      "growthTrend": 0.0,
      "inflationTrend": 0.0,
      "usdTrend": 0.0,
      "realYield": 3.1,
      "fedRate": 5.98,
      "creditSpread": 9.13,
      "ratePath": -1.42,
      "creditSpreadMomentum": 2.39
    },
    "actualReturns": {
      "usStock": -0.0814,
      "precious": 0.0707,
      "energy": -0.0072,
      "hedges": -0.1785
    },
    "dataSource": "FRED + Yahoo Finance (Auto)",
    "macroSources": {
      "usd": "Yahoo Finance",
      "vix": "Yahoo Finance",
      "realYield": "YF:^TNX-2.0(est)",
      "fedRate": "FRED:FEDFUNDS",
      "creditSpread": "FRED:BAMLH0A0HYM2",
      "ratePath": "FRED: DGS2 - FEDFUNDS",
      "creditSpreadMomentum": "Calculated: QoQ delta of BAMLH0A0HYM2"
    },
    "returnSources": {
      "usStock": "ETF:SPY",
      "precious": "Proxy:^XAU",
      "energy": "ETF:XLE",
      "hedges": "Proxy:^IRX"
    }
  },
  "quarterly_2001_q1": {
    "period": "2001-Q1",
    "description": "连续季度数据 2001-Q1",
    "quality": "C",
    "macroData": {
      "usd": 117.37,
      "vix": 28.64,
      "cnPolicy": 0.0,
      "cnPolicyTrend": 0.0,
      "momentum": -0.8,
      "adoption": 0.1,
      "btcCycle": 0.3,
      "rateChangeReason": 0.0,
      "usdReason": 0.0,
      "vixReason": 0.0,
      "inflationReason": 0.0,
      "globalGrowth": 3.0,
      "growthTrend": 0.0,
      "inflationTrend": 0.0,
      "usdTrend": 0.0,
      "realYield": 2.93,
      "fedRate": 4.8,
      "creditSpread": 8.48,
      "ratePath": -0.61,
      "creditSpreadMomentum": -0.65
    },
    "actualReturns": {
      "usStock": -0.107,
      "precious": 0.0201,
      "energy": -0.0385,
      "hedges": -0.1972
    },
    "dataSource": "FRED + Yahoo Finance (Auto)",
    "macroSources": {
      "usd": "Yahoo Finance",
      "vix": "Yahoo Finance",
      "realYield": "YF:^TNX-2.0(est)",
      "fedRate": "FRED:FEDFUNDS",
      "creditSpread": "FRED:BAMLH0A0HYM2",
      "ratePath": "FRED: DGS2 - FEDFUNDS",
      "creditSpreadMomentum": "Calculated: QoQ delta of BAMLH0A0HYM2"
    },
    "returnSources": {
      "usStock": "ETF:SPY",
      "precious": "Proxy:^XAU",
      "energy": "ETF:XLE",
      "hedges": "Proxy:^IRX"
    }
  },
  "quarterly_2001_q2": {
    "period": "2001-Q2",
    "description": "连续季度数据 2001-Q2",
    "quality": "C",
    "macroData": {
      "usd": 119.43,
      "vix": 19.06,
      "cnPolicy": 0.0,
      "cnPolicyTrend": 0.0,
      "momentum": 0.5,
      "adoption": 0.1,
      "btcCycle": 0.3,
      "rateChangeReason": 0.0,
      "usdReason": 0.0,
      "vixReason": 0.0,
      "inflationReason": 0.0,
      "globalGrowth": 3.0,
      "growthTrend": 0.0,
      "inflationTrend": 0.0,
      "usdTrend": 0.0,
      "realYield": 3.38,
      "fedRate": 3.77,
      "creditSpread": 8.1,
      "ratePath": 0.47,
      "creditSpreadMomentum": -0.38
    },
    "actualReturns": {
      "usStock": 0.077,
      "precious": 0.0302,
      "energy": 0.0001,
      "hedges": -0.0729
    },
    "dataSource": "FRED + Yahoo Finance (Auto)",
    "macroSources": {
      "usd": "Yahoo Finance",
      "vix": "Yahoo Finance",
      "realYield": "YF:^TNX-2.0(est)",
      "fedRate": "FRED:FEDFUNDS",
      "creditSpread": "FRED:BAMLH0A0HYM2",
      "ratePath": "FRED: DGS2 - FEDFUNDS",
      "creditSpreadMomentum": "Calculated: QoQ delta of BAMLH0A0HYM2"
    },
    "returnSources": {
      "usStock": "ETF:SPY",
      "precious": "Proxy:^XAU",
      "energy": "ETF:XLE",
      "hedges": "Proxy:^IRX"
    }
  },
  "quarterly_2001_q3": {
    "period": "2001-Q3",
    "description": "连续季度数据 2001-Q3",
    "quality": "C",
    "macroData": {
      "usd": 113.48,
      "vix": 31.93,
      "cnPolicy": 0.0,
      "cnPolicyTrend": 0.0,
      "momentum": -0.8,
      "adoption": 0.1,
      "btcCycle": 0.3,
      "rateChangeReason": 0.0,
      "usdReason": 0.0,
      "vixReason": 0.0,
      "inflationReason": 0.0,
      "globalGrowth": 3.0,
      "growthTrend": 0.0,
      "inflationTrend": 0.0,
      "usdTrend": 0.0,
      "realYield": 2.46,
      "fedRate": 2.49,
      "creditSpread": 10.14,
      "ratePath": 0.22,
      "creditSpreadMomentum": 2.04
    },
    "actualReturns": {
      "usStock": -0.0959,
      "precious": 0.1193,
      "energy": -0.0999,
      "hedges": -0.3892
    },
    "dataSource": "FRED + Yahoo Finance (Auto)",
    "macroSources": {
      "usd": "Yahoo Finance",
      "vix": "Yahoo Finance",
      "realYield": "YF:^TNX-2.0(est)",
      "fedRate": "FRED:FEDFUNDS",
      "creditSpread": "FRED:BAMLH0A0HYM2",
      "ratePath": "FRED: DGS2 - FEDFUNDS",
      "creditSpreadMomentum": "Calculated: QoQ delta of BAMLH0A0HYM2"
    },
    "returnSources": {
      "usStock": "ETF:SPY",
      "precious": "Proxy:^XAU",
      "energy": "ETF:XLE",
      "hedges": "Proxy:^IRX"
    }
  },
  "quarterly_2001_q4": {
    "period": "2001-Q4",
    "description": "连续季度数据 2001-Q4",
    "quality": "B",
    "macroData": {
      "usd": 116.75,
      "vix": 23.8,
      "cnPolicy": 0.0,
      "cnPolicyTrend": 0.0,
      "momentum": 0.8,
      "adoption": 0.1,
      "btcCycle": 0.3,
      "rateChangeReason": 0.0,
      "usdReason": 0.0,
      "vixReason": 0.0,
      "inflationReason": 0.0,
      "globalGrowth": 3.0,
      "growthTrend": 0.0,
      "inflationTrend": 0.0,
      "usdTrend": 0.0,
      "realYield": 3.12,
      "fedRate": 1.73,
      "creditSpread": 8.03,
      "ratePath": 1.46,
      "creditSpreadMomentum": -2.11
    },
    "actualReturns": {
      "usStock": 0.1007,
      "devStock": 0.0594,
      "precious": -0.0348,
      "energy": -0.0232,
      "hedges": -0.2186
    },
    "dataSource": "FRED + Yahoo Finance (Auto)",
    "macroSources": {
      "usd": "Yahoo Finance",
      "vix": "Yahoo Finance",
      "realYield": "YF:^TNX-2.0(est)",
      "fedRate": "FRED:FEDFUNDS",
      "creditSpread": "FRED:BAMLH0A0HYM2",
      "ratePath": "FRED: DGS2 - FEDFUNDS",
      "creditSpreadMomentum": "Calculated: QoQ delta of BAMLH0A0HYM2"
    },
    "returnSources": {
      "usStock": "ETF:SPY",
      "devStock": "ETF:EFA",
      "precious": "Proxy:^XAU",
      "energy": "ETF:XLE",
      "hedges": "Proxy:^IRX"
    }
  },
  "quarterly_2002_q1": {
    "period": "2002-Q1",
    "description": "连续季度数据 2002-Q1",
    "quality": "B",
    "macroData": {
      "usd": 118.62,
      "vix": 17.4,
      "cnPolicy": 0.0,
      "cnPolicyTrend": 0.0,
      "momentum": -0.5,
      "adoption": 0.1,
      "btcCycle": 0.3,
      "rateChangeReason": 0.0,
      "usdReason": 0.0,
      "vixReason": 0.0,
      "inflationReason": 0.0,
      "globalGrowth": 3.0,
      "growthTrend": 0.0,
      "inflationTrend": 0.0,
      "usdTrend": 0.0,
      "realYield": 3.28,
      "fedRate": 1.75,
      "creditSpread": 7.15,
      "ratePath": 1.74,
      "creditSpreadMomentum": -0.88
    },
    "actualReturns": {
      "usStock": -0.0392,
      "devStock": -0.0139,
      "precious": 0.2227,
      "energy": 0.0606,
      "hedges": 0.0238
    },
    "dataSource": "FRED + Yahoo Finance (Auto)",
    "macroSources": {
      "usd": "Yahoo Finance",
      "vix": "Yahoo Finance",
      "realYield": "YF:^TNX-2.0(est)",
      "fedRate": "FRED:FEDFUNDS",
      "creditSpread": "FRED:BAMLH0A0HYM2",
      "ratePath": "FRED: DGS2 - FEDFUNDS",
      "creditSpreadMomentum": "Calculated: QoQ delta of BAMLH0A0HYM2"
    },
    "returnSources": {
      "usStock": "ETF:SPY",
      "devStock": "ETF:EFA",
      "precious": "Proxy:^XAU",
      "energy": "ETF:XLE",
      "hedges": "Proxy:^IRX"
    }
  },
  "quarterly_2002_q2": {
    "period": "2002-Q2",
    "description": "连续季度数据 2002-Q2",
    "quality": "B",
    "macroData": {
      "usd": 106.11,
      "vix": 25.4,
      "cnPolicy": 0.0,
      "cnPolicyTrend": 0.0,
      "momentum": -0.8,
      "adoption": 0.1,
      "btcCycle": 0.3,
      "rateChangeReason": 0.0,
      "usdReason": 0.0,
      "vixReason": 0.0,
      "inflationReason": 0.0,
      "globalGrowth": 3.0,
      "growthTrend": 0.0,
      "inflationTrend": 0.0,
      "usdTrend": 0.0,
      "realYield": 2.74,
      "fedRate": 1.73,
      "creditSpread": 9.02,
      "ratePath": 1.17,
      "creditSpreadMomentum": 1.87
    },
    "actualReturns": {
      "usStock": -0.1156,
      "devStock": -0.0113,
      "precious": 0.0177,
      "energy": -0.0576,
      "hedges": -0.0203
    },
    "dataSource": "FRED + Yahoo Finance (Auto)",
    "macroSources": {
      "usd": "Yahoo Finance",
      "vix": "Yahoo Finance",
      "realYield": "YF:^TNX-2.0(est)",
      "fedRate": "FRED:FEDFUNDS",
      "creditSpread": "FRED:BAMLH0A0HYM2",
      "ratePath": "FRED: DGS2 - FEDFUNDS",
      "creditSpreadMomentum": "Calculated: QoQ delta of BAMLH0A0HYM2"
    },
    "returnSources": {
      "usStock": "ETF:SPY",
      "devStock": "ETF:EFA",
      "precious": "Proxy:^XAU",
      "energy": "ETF:XLE",
      "hedges": "Proxy:^IRX"
    }
  },
  "quarterly_2002_q3": {
    "period": "2002-Q3",
    "description": "连续季度数据 2002-Q3",
    "quality": "B",
    "macroData": {
      "usd": 106.87,
      "vix": 39.69,
      "cnPolicy": 0.0,
      "cnPolicyTrend": 0.0,
      "momentum": -0.8,
      "adoption": 0.1,
      "btcCycle": 0.3,
      "rateChangeReason": 0.0,
      "usdReason": 0.0,
      "vixReason": 0.0,
      "inflationReason": 0.0,
      "globalGrowth": 3.0,
      "growthTrend": 0.0,
      "inflationTrend": 0.0,
      "usdTrend": 0.0,
      "realYield": 1.68,
      "fedRate": 1.75,
      "creditSpread": 10.48,
      "ratePath": 0.03,
      "creditSpreadMomentum": 1.46
    },
    "actualReturns": {
      "usStock": -0.1827,
      "devStock": -0.2129,
      "precious": -0.0369,
      "energy": -0.1803,
      "hedges": -0.07
    },
    "dataSource": "FRED + Yahoo Finance (Auto)",
    "macroSources": {
      "usd": "Yahoo Finance",
      "vix": "Yahoo Finance",
      "realYield": "YF:^TNX-2.0(est)",
      "fedRate": "FRED:FEDFUNDS",
      "creditSpread": "FRED:BAMLH0A0HYM2",
      "ratePath": "FRED: DGS2 - FEDFUNDS",
      "creditSpreadMomentum": "Calculated: QoQ delta of BAMLH0A0HYM2"
    },
    "returnSources": {
      "usStock": "ETF:SPY",
      "devStock": "ETF:EFA",
      "precious": "Proxy:^XAU",
      "energy": "ETF:XLE",
      "hedges": "Proxy:^IRX"
    }
  },
  "quarterly_2002_q4": {
    "period": "2002-Q4",
    "description": "连续季度数据 2002-Q4",
    "quality": "B",
    "macroData": {
      "usd": 101.85,
      "vix": 28.62,
      "cnPolicy": 0.0,
      "cnPolicyTrend": 0.0,
      "momentum": 0.8,
      "adoption": 0.1,
      "btcCycle": 0.3,
      "rateChangeReason": 0.0,
      "usdReason": 0.0,
      "vixReason": 0.0,
      "inflationReason": 0.0,
      "globalGrowth": 3.0,
      "growthTrend": 0.0,
      "inflationTrend": 0.0,
      "usdTrend": 0.0,
      "realYield": 2.43,
      "fedRate": 1.24,
      "inflation": 1.28,
      "creditSpread": 8.57,
      "ratePath": 0.55,
      "creditSpreadMomentum": -1.91
    },
    "actualReturns": {
      "usStock": 0.1361,
      "devStock": 0.1031,
      "precious": 0.1858,
      "energy": 0.071,
      "hedges": -0.2393
    },
    "dataSource": "FRED + Yahoo Finance (Auto)",
    "macroSources": {
      "usd": "Yahoo Finance",
      "vix": "Yahoo Finance",
      "realYield": "FRED:DFII10",
      "fedRate": "FRED:FEDFUNDS",
      "inflation": "FRED:T5YIE",
      "creditSpread": "FRED:BAMLH0A0HYM2",
      "ratePath": "FRED: DGS2 - FEDFUNDS",
      "creditSpreadMomentum": "Calculated: QoQ delta of BAMLH0A0HYM2"
    },
    "returnSources": {
      "usStock": "ETF:SPY",
      "devStock": "ETF:EFA",
      "precious": "Proxy:^XAU",
      "energy": "ETF:XLE",
      "hedges": "Proxy:^IRX"
    }
  },
  "quarterly_2003_q1": {
    "period": "2003-Q1",
    "description": "连续季度数据 2003-Q1",
    "quality": "B",
    "macroData": {
      "usd": 99.06,
      "vix": 29.15,
      "cnPolicy": 0.0,
      "cnPolicyTrend": 0.0,
      "momentum": -0.5,
      "adoption": 0.1,
      "btcCycle": 0.3,
      "rateChangeReason": 0.0,
      "usdReason": 0.0,
      "vixReason": 0.0,
      "inflationReason": 0.0,
      "globalGrowth": 3.0,
      "growthTrend": 0.0,
      "inflationTrend": 0.0,
      "usdTrend": 0.0,
      "realYield": 2.12,
      "fedRate": 1.26,
      "inflation": 1.64,
      "creditSpread": 7.31,
      "ratePath": 0.29,
      "creditSpreadMomentum": -1.26
    },
    "actualReturns": {
      "usStock": -0.0472,
      "devStock": -0.0799,
      "precious": -0.1716,
      "energy": -0.0193,
      "hedges": -0.0846
    },
    "dataSource": "FRED + Yahoo Finance (Auto)",
    "macroSources": {
      "usd": "Yahoo Finance",
      "vix": "Yahoo Finance",
      "realYield": "FRED:DFII10",
      "fedRate": "FRED:FEDFUNDS",
      "inflation": "FRED:T5YIE",
      "creditSpread": "FRED:BAMLH0A0HYM2",
      "ratePath": "FRED: DGS2 - FEDFUNDS",
      "creditSpreadMomentum": "Calculated: QoQ delta of BAMLH0A0HYM2"
    },
    "returnSources": {
      "usStock": "ETF:SPY",
      "devStock": "ETF:EFA",
      "precious": "Proxy:^XAU",
      "energy": "ETF:XLE",
      "hedges": "Proxy:^IRX"
    }
  },
  "quarterly_2003_q2": {
    "period": "2003-Q2",
    "description": "连续季度数据 2003-Q2",
    "quality": "B",
    "macroData": {
      "usd": 94.73,
      "vix": 19.52,
      "cnPolicy": 0.0,
      "cnPolicyTrend": 0.0,
      "momentum": 0.8,
      "adoption": 0.1,
      "btcCycle": 0.3,
      "rateChangeReason": 0.0,
      "usdReason": 0.0,
      "vixReason": 0.0,
      "inflationReason": 0.0,
      "globalGrowth": 3.0,
      "growthTrend": 0.0,
      "inflationTrend": 0.0,
      "usdTrend": 0.0,
      "realYield": 2.09,
      "fedRate": 1.01,
      "inflation": 1.44,
      "creditSpread": 6.11,
      "ratePath": NaN,
      "creditSpreadMomentum": -1.2
    },
    "actualReturns": {
      "usStock": 0.1233,
      "devStock": 0.1723,
      "precious": 0.2328,
      "energy": 0.0753,
      "hedges": -0.2218
    },
    "dataSource": "FRED + Yahoo Finance (Auto)",
    "macroSources": {
      "usd": "Yahoo Finance",
      "vix": "Yahoo Finance",
      "realYield": "FRED:DFII10",
      "fedRate": "FRED:FEDFUNDS",
      "inflation": "FRED:T5YIE",
      "creditSpread": "FRED:BAMLH0A0HYM2",
      "ratePath": "FRED: DGS2 - FEDFUNDS",
      "creditSpreadMomentum": "Calculated: QoQ delta of BAMLH0A0HYM2"
    },
    "returnSources": {
      "usStock": "ETF:SPY",
      "devStock": "ETF:EFA",
      "precious": "Proxy:^XAU",
      "energy": "ETF:XLE",
      "hedges": "Proxy:^IRX"
    }
  },
  "quarterly_2003_q3": {
    "period": "2003-Q3",
    "description": "连续季度数据 2003-Q3",
    "quality": "B",
    "macroData": {
      "usd": 92.85,
      "vix": 22.72,
      "cnPolicy": 0.0,
      "cnPolicyTrend": 0.0,
      "momentum": 0.5,
      "adoption": 0.1,
      "btcCycle": 0.3,
      "rateChangeReason": 0.0,
      "usdReason": 0.0,
      "vixReason": 0.0,
      "inflationReason": 0.0,
      "globalGrowth": 3.0,
      "growthTrend": 0.0,
      "inflationTrend": 0.0,
      "usdTrend": 0.0,
      "realYield": 2.16,
      "fedRate": 1.01,
      "inflation": 1.89,
      "creditSpread": 5.18,
      "ratePath": 0.64,
      "creditSpreadMomentum": -0.93
    },
    "actualReturns": {
      "usStock": 0.0511,
      "devStock": 0.1078,
      "emStock": 0.1487,
      "precious": 0.1105,
      "energy": 0.0361,
      "hedges": 0.0831
    },
    "dataSource": "FRED + Yahoo Finance (Auto)",
    "macroSources": {
      "usd": "Yahoo Finance",
      "vix": "Yahoo Finance",
      "realYield": "FRED:DFII10",
      "fedRate": "FRED:FEDFUNDS",
      "inflation": "FRED:T5YIE",
      "creditSpread": "FRED:BAMLH0A0HYM2",
      "ratePath": "FRED: DGS2 - FEDFUNDS",
      "creditSpreadMomentum": "Calculated: QoQ delta of BAMLH0A0HYM2"
    },
    "returnSources": {
      "usStock": "ETF:SPY",
      "devStock": "ETF:EFA",
      "emStock": "ETF:EEM",
      "precious": "Proxy:^XAU",
      "energy": "ETF:XLE",
      "hedges": "Proxy:^IRX"
    }
  },
  "quarterly_2003_q4": {
    "period": "2003-Q4",
    "description": "连续季度数据 2003-Q4",
    "quality": "B",
    "macroData": {
      "usd": 86.92,
      "vix": 18.31,
      "cnPolicy": 0.0,
      "cnPolicyTrend": 0.0,
      "momentum": 0.8,
      "adoption": 0.1,
      "btcCycle": 0.3,
      "rateChangeReason": 0.0,
      "usdReason": 0.0,
      "vixReason": 0.0,
      "inflationReason": 0.0,
      "globalGrowth": 3.0,
      "growthTrend": 0.0,
      "inflationTrend": 0.0,
      "usdTrend": 0.0,
      "realYield": 2.06,
      "fedRate": 1.0,
      "inflation": 2.08,
      "creditSpread": 4.08,
      "ratePath": 0.95,
      "creditSpreadMomentum": -1.1
    },
    "actualReturns": {
      "usStock": 0.0877,
      "devStock": 0.1478,
      "emStock": 0.2155,
      "bonds_us": 0.007,
      "precious": 0.2663,
      "energy": 0.1346,
      "hedges": -0.0033
    },
    "dataSource": "FRED + Yahoo Finance (Auto)",
    "macroSources": {
      "usd": "Yahoo Finance",
      "vix": "Yahoo Finance",
      "realYield": "FRED:DFII10",
      "fedRate": "FRED:FEDFUNDS",
      "inflation": "FRED:T5YIE",
      "creditSpread": "FRED:BAMLH0A0HYM2",
      "ratePath": "FRED: DGS2 - FEDFUNDS",
      "creditSpreadMomentum": "Calculated: QoQ delta of BAMLH0A0HYM2"
    },
    "returnSources": {
      "usStock": "ETF:SPY",
      "devStock": "ETF:EFA",
      "emStock": "ETF:EEM",
      "bonds_us": "ETF:AGG",
      "precious": "Proxy:^XAU",
      "energy": "ETF:XLE",
      "hedges": "Proxy:^IRX"
    }
  },
  "quarterly_2004_q1": {
    "period": "2004-Q1",
    "description": "连续季度数据 2004-Q1",
    "quality": "B",
    "macroData": {
      "usd": 87.61,
      "vix": 16.74,
      "cnPolicy": 0.0,
      "cnPolicyTrend": 0.0,
      "momentum": 0.0,
      "adoption": 0.1,
      "btcCycle": 0.3,
      "rateChangeReason": 0.0,
      "usdReason": 0.0,
      "vixReason": 0.0,
      "inflationReason": 0.0,
      "globalGrowth": 3.0,
      "growthTrend": 0.0,
      "inflationTrend": 0.0,
      "usdTrend": 0.0,
      "realYield": 1.69,
      "fedRate": 1.0,
      "inflation": 2.38,
      "creditSpread": 4.16,
      "ratePath": 0.91,
      "creditSpreadMomentum": 0.08
    },
    "actualReturns": {
      "usStock": 0.0278,
      "devStock": 0.0278,
      "emStock": 0.0493,
      "bonds_us": 0.0077,
      "precious": -0.0802,
      "energy": 0.0487,
      "hedges": 0.0122
    },
    "dataSource": "FRED + Yahoo Finance (Auto)",
    "macroSources": {
      "usd": "Yahoo Finance",
      "vix": "Yahoo Finance",
      "realYield": "FRED:DFII10",
      "fedRate": "FRED:FEDFUNDS",
      "inflation": "FRED:T5YIE",
      "creditSpread": "FRED:BAMLH0A0HYM2",
      "ratePath": "FRED: DGS2 - FEDFUNDS",
      "creditSpreadMomentum": "Calculated: QoQ delta of BAMLH0A0HYM2"
    },
    "returnSources": {
      "usStock": "ETF:SPY",
      "devStock": "ETF:EFA",
      "emStock": "ETF:EEM",
      "bonds_us": "ETF:AGG",
      "precious": "Proxy:^XAU",
      "energy": "ETF:XLE",
      "hedges": "Proxy:^IRX"
    }
  },
  "quarterly_2004_q2": {
    "period": "2004-Q2",
    "description": "连续季度数据 2004-Q2",
    "quality": "B",
    "macroData": {
      "usd": 88.8,
      "vix": 14.34,
      "cnPolicy": 0.0,
      "cnPolicyTrend": 0.0,
      "momentum": 0.0,
      "adoption": 0.1,
      "btcCycle": 0.3,
      "rateChangeReason": 0.0,
      "usdReason": 0.0,
      "vixReason": 0.0,
      "inflationReason": 0.0,
      "globalGrowth": 3.0,
      "growthTrend": 0.0,
      "inflationTrend": 0.0,
      "usdTrend": 0.0,
      "realYield": 1.96,
      "fedRate": 1.26,
      "inflation": 2.41,
      "creditSpread": 4.17,
      "ratePath": NaN,
      "creditSpreadMomentum": 0.01
    },
    "actualReturns": {
      "usStock": -0.014,
      "devStock": -0.0102,
      "emStock": -0.118,
      "bonds_us": -0.0053,
      "precious": -0.1482,
      "energy": 0.0849,
      "hedges": 0.3758
    },
    "dataSource": "FRED + Yahoo Finance (Auto)",
    "macroSources": {
      "usd": "Yahoo Finance",
      "vix": "Yahoo Finance",
      "realYield": "FRED:DFII10",
      "fedRate": "FRED:FEDFUNDS",
      "inflation": "FRED:T5YIE",
      "creditSpread": "FRED:BAMLH0A0HYM2",
      "ratePath": "FRED: DGS2 - FEDFUNDS",
      "creditSpreadMomentum": "Calculated: QoQ delta of BAMLH0A0HYM2"
    },
    "returnSources": {
      "usStock": "ETF:SPY",
      "devStock": "ETF:EFA",
      "emStock": "ETF:EEM",
      "bonds_us": "ETF:AGG",
      "precious": "Proxy:^XAU",
      "energy": "ETF:XLE",
      "hedges": "Proxy:^IRX"
    }
  },
  "quarterly_2004_q3": {
    "period": "2004-Q3",
    "description": "连续季度数据 2004-Q3",
    "quality": "B",
    "macroData": {
      "usd": 87.36,
      "vix": 13.34,
      "cnPolicy": 0.0,
      "cnPolicyTrend": 0.0,
      "momentum": 0.0,
      "adoption": 0.1,
      "btcCycle": 0.3,
      "rateChangeReason": 0.0,
      "usdReason": 0.0,
      "vixReason": 0.0,
      "inflationReason": 0.0,
      "globalGrowth": 3.0,
      "growthTrend": 0.0,
      "inflationTrend": 0.0,
      "usdTrend": 0.0,
      "realYield": 1.83,
      "fedRate": 1.76,
      "inflation": 2.35,
      "creditSpread": 3.78,
      "ratePath": 0.89,
      "creditSpreadMomentum": -0.39
    },
    "actualReturns": {
      "usStock": 0.0222,
      "devStock": 0.0304,
      "emStock": 0.1241,
      "bonds_us": 0.0221,
      "precious": 0.1801,
      "energy": 0.1322,
      "hedges": 0.3325
    },
    "dataSource": "FRED + Yahoo Finance (Auto)",
    "macroSources": {
      "usd": "Yahoo Finance",
      "vix": "Yahoo Finance",
      "realYield": "FRED:DFII10",
      "fedRate": "FRED:FEDFUNDS",
      "inflation": "FRED:T5YIE",
      "creditSpread": "FRED:BAMLH0A0HYM2",
      "ratePath": "FRED: DGS2 - FEDFUNDS",
      "creditSpreadMomentum": "Calculated: QoQ delta of BAMLH0A0HYM2"
    },
    "returnSources": {
      "usStock": "ETF:SPY",
      "devStock": "ETF:EFA",
      "emStock": "ETF:EEM",
      "bonds_us": "ETF:AGG",
      "precious": "Proxy:^XAU",
      "energy": "ETF:XLE",
      "hedges": "Proxy:^IRX"
    }
  },
  "quarterly_2004_q4": {
    "period": "2004-Q4",
    "description": "连续季度数据 2004-Q4",
    "quality": "B",
    "macroData": {
      "usd": 80.85,
      "vix": 13.29,
      "cnPolicy": 0.0,
      "cnPolicyTrend": 0.0,
      "momentum": 0.5,
      "adoption": 0.1,
      "btcCycle": 0.3,
      "rateChangeReason": 0.0,
      "usdReason": 0.0,
      "vixReason": 0.0,
      "inflationReason": 0.0,
      "globalGrowth": 3.0,
      "growthTrend": 0.0,
      "inflationTrend": 0.0,
      "usdTrend": 0.0,
      "realYield": 1.7,
      "fedRate": 2.28,
      "inflation": 2.62,
      "creditSpread": 3.06,
      "ratePath": 0.94,
      "creditSpreadMomentum": -0.72
    },
    "actualReturns": {
      "usStock": 0.037,
      "devStock": 0.0963,
      "emStock": 0.0782,
      "bonds_us": 0.0113,
      "precious": -0.0353,
      "energy": -0.0454,
      "hedges": 0.364
    },
    "dataSource": "FRED + Yahoo Finance (Auto)",
    "macroSources": {
      "usd": "Yahoo Finance",
      "vix": "Yahoo Finance",
      "realYield": "FRED:DFII10",
      "fedRate": "FRED:FEDFUNDS",
      "inflation": "FRED:T5YIE",
      "creditSpread": "FRED:BAMLH0A0HYM2",
      "ratePath": "FRED: DGS2 - FEDFUNDS",
      "creditSpreadMomentum": "Calculated: QoQ delta of BAMLH0A0HYM2"
    },
    "returnSources": {
      "usStock": "ETF:SPY",
      "devStock": "ETF:EFA",
      "emStock": "ETF:EEM",
      "bonds_us": "ETF:AGG",
      "precious": "Proxy:^XAU",
      "energy": "ETF:XLE",
      "hedges": "Proxy:^IRX"
    }
  },
  "quarterly_2005_q1": {
    "period": "2005-Q1",
    "description": "连续季度数据 2005-Q1",
    "quality": "A",
    "macroData": {
      "usd": 84.06,
      "vix": 14.02,
      "cnPolicy": 0.0,
      "cnPolicyTrend": 0.0,
      "momentum": 0.0,
      "adoption": 0.1,
      "btcCycle": 0.3,
      "rateChangeReason": 0.0,
      "usdReason": 0.0,
      "vixReason": 0.0,
      "inflationReason": 0.0,
      "globalGrowth": 3.0,
      "growthTrend": 0.0,
      "inflationTrend": 0.0,
      "usdTrend": 0.0,
      "realYield": 1.77,
      "fedRate": 2.79,
      "inflation": 2.85,
      "creditSpread": 3.55,
      "ratePath": 0.96,
      "creditSpreadMomentum": 0.49
    },
    "actualReturns": {
      "cnStock": 0.0467,
      "hkStock": 0.0467,
      "usStock": 0.0004,
      "devStock": 0.0221,
      "emStock": 0.0696,
      "bonds_us": -0.0052,
      "precious": 0.0071,
      "energy": 0.2239,
      "hedges": 0.2034
    },
    "dataSource": "FRED + Yahoo Finance (Auto)",
    "macroSources": {
      "usd": "Yahoo Finance",
      "vix": "Yahoo Finance",
      "realYield": "FRED:DFII10",
      "fedRate": "FRED:FEDFUNDS",
      "inflation": "FRED:T5YIE",
      "creditSpread": "FRED:BAMLH0A0HYM2",
      "ratePath": "FRED: DGS2 - FEDFUNDS",
      "creditSpreadMomentum": "Calculated: QoQ delta of BAMLH0A0HYM2"
    },
    "returnSources": {
      "cnStock": "Proxy:FXI",
      "hkStock": "Proxy:FXI",
      "usStock": "ETF:SPY",
      "devStock": "ETF:EFA",
      "emStock": "ETF:EEM",
      "bonds_us": "ETF:AGG",
      "precious": "ETF:GLD",
      "energy": "ETF:XLE",
      "hedges": "Proxy:^IRX"
    }
  },
  "quarterly_2005_q2": {
    "period": "2005-Q2",
    "description": "连续季度数据 2005-Q2",
    "quality": "A",
    "macroData": {
      "usd": 89.11,
      "vix": 12.04,
      "cnPolicy": 0.0,
      "cnPolicyTrend": 0.0,
      "momentum": 0.0,
      "adoption": 0.1,
      "btcCycle": 0.3,
      "rateChangeReason": 0.0,
      "usdReason": 0.0,
      "vixReason": 0.0,
      "inflationReason": 0.0,
      "globalGrowth": 3.0,
      "growthTrend": 0.0,
      "inflationTrend": 0.0,
      "usdTrend": 0.0,
      "realYield": 1.75,
      "fedRate": 3.26,
      "inflation": 2.34,
      "creditSpread": 3.75,
      "ratePath": 0.53,
      "creditSpreadMomentum": 0.2
    },
    "actualReturns": {
      "cnStock": 0.0452,
      "hkStock": 0.0452,
      "usStock": 0.02,
      "devStock": -0.017,
      "emStock": 0.0451,
      "bonds_us": 0.0217,
      "precious": -0.0082,
      "energy": 0.0748,
      "hedges": 0.161
    },
    "dataSource": "FRED + Yahoo Finance (Auto)",
    "macroSources": {
      "usd": "Yahoo Finance",
      "vix": "Yahoo Finance",
      "realYield": "FRED:DFII10",
      "fedRate": "FRED:FEDFUNDS",
      "inflation": "FRED:T5YIE",
      "creditSpread": "FRED:BAMLH0A0HYM2",
      "ratePath": "FRED: DGS2 - FEDFUNDS",
      "creditSpreadMomentum": "Calculated: QoQ delta of BAMLH0A0HYM2"
    },
    "returnSources": {
      "cnStock": "Proxy:FXI",
      "hkStock": "Proxy:FXI",
      "usStock": "ETF:SPY",
      "devStock": "ETF:EFA",
      "emStock": "ETF:EEM",
      "bonds_us": "ETF:AGG",
      "precious": "ETF:GLD",
      "energy": "ETF:XLE",
      "hedges": "Proxy:^IRX"
    }
  },
  "quarterly_2005_q3": {
    "period": "2005-Q3",
    "description": "连续季度数据 2005-Q3",
    "quality": "A",
    "macroData": {
      "usd": 89.52,
      "vix": 11.92,
      "cnPolicy": 0.0,
      "cnPolicyTrend": 0.0,
      "momentum": 0.0,
      "adoption": 0.1,
      "btcCycle": 0.3,
      "rateChangeReason": 0.0,
      "usdReason": 0.0,
      "vixReason": 0.0,
      "inflationReason": 0.0,
      "globalGrowth": 3.0,
      "growthTrend": 0.0,
      "inflationTrend": 0.0,
      "usdTrend": 0.0,
      "realYield": 1.84,
      "fedRate": 3.78,
      "inflation": 2.71,
      "creditSpread": 3.47,
      "ratePath": 0.43,
      "creditSpreadMomentum": -0.28
    },
    "actualReturns": {
      "cnStock": 0.0757,
      "hkStock": 0.0757,
      "usStock": 0.0055,
      "devStock": 0.0915,
      "emStock": 0.1423,
      "bonds_us": -0.0028,
      "precious": 0.0973,
      "energy": 0.0827,
      "hedges": 0.1186
    },
    "dataSource": "FRED + Yahoo Finance (Auto)",
    "macroSources": {
      "usd": "Yahoo Finance",
      "vix": "Yahoo Finance",
      "realYield": "FRED:DFII10",
      "fedRate": "FRED:FEDFUNDS",
      "inflation": "FRED:T5YIE",
      "creditSpread": "FRED:BAMLH0A0HYM2",
      "ratePath": "FRED: DGS2 - FEDFUNDS",
      "creditSpreadMomentum": "Calculated: QoQ delta of BAMLH0A0HYM2"
    },
    "returnSources": {
      "cnStock": "Proxy:FXI",
      "hkStock": "Proxy:FXI",
      "usStock": "ETF:SPY",
      "devStock": "ETF:EFA",
      "emStock": "ETF:EEM",
      "bonds_us": "ETF:AGG",
      "precious": "ETF:GLD",
      "energy": "ETF:XLE",
      "hedges": "Proxy:^IRX"
    }
  },
  "quarterly_2005_q4": {
    "period": "2005-Q4",
    "description": "连续季度数据 2005-Q4",
    "quality": "A",
    "macroData": {
      "usd": 91.17,
      "vix": 12.07,
      "cnPolicy": 0.0,
      "cnPolicyTrend": 0.0,
      "momentum": 0.5,
      "adoption": 0.1,
      "btcCycle": 0.3,
      "rateChangeReason": 0.0,
      "usdReason": 0.0,
      "vixReason": 0.0,
      "inflationReason": 0.0,
      "globalGrowth": 3.0,
      "growthTrend": 0.0,
      "inflationTrend": 0.0,
      "usdTrend": 0.0,
      "realYield": 2.03,
      "fedRate": 4.29,
      "inflation": 2.3,
      "creditSpread": 3.73,
      "ratePath": 0.03,
      "creditSpreadMomentum": 0.26
    },
    "actualReturns": {
      "cnStock": 0.0962,
      "hkStock": 0.0962,
      "usStock": 0.0743,
      "devStock": 0.106,
      "emStock": 0.1857,
      "bonds_us": 0.0091,
      "precious": 0.1087,
      "energy": 0.08,
      "hedges": 0.1646
    },
    "dataSource": "FRED + Yahoo Finance (Auto)",
    "macroSources": {
      "usd": "Yahoo Finance",
      "vix": "Yahoo Finance",
      "realYield": "FRED:DFII10",
      "fedRate": "FRED:FEDFUNDS",
      "inflation": "FRED:T5YIE",
      "creditSpread": "FRED:BAMLH0A0HYM2",
      "ratePath": "FRED: DGS2 - FEDFUNDS",
      "creditSpreadMomentum": "Calculated: QoQ delta of BAMLH0A0HYM2"
    },
    "returnSources": {
      "cnStock": "Proxy:FXI",
      "hkStock": "Proxy:FXI",
      "usStock": "ETF:SPY",
      "devStock": "ETF:EFA",
      "emStock": "ETF:EEM",
      "bonds_us": "ETF:AGG",
      "precious": "ETF:GLD",
      "energy": "ETF:XLE",
      "hedges": "Proxy:^IRX"
    }
  },
  "quarterly_2006_q1": {
    "period": "2006-Q1",
    "description": "连续季度数据 2006-Q1",
    "quality": "A",
    "macroData": {
      "usd": 89.73,
      "vix": 11.39,
      "cnPolicy": 0.0,
      "cnPolicyTrend": 0.0,
      "momentum": 0.0,
      "adoption": 0.1,
      "btcCycle": 0.3,
      "rateChangeReason": 0.0,
      "usdReason": 0.0,
      "vixReason": 0.0,
      "inflationReason": 0.0,
      "globalGrowth": 3.0,
      "growthTrend": 0.0,
      "inflationTrend": 0.0,
      "usdTrend": 0.0,
      "realYield": 2.36,
      "fedRate": 4.79,
      "inflation": 2.59,
      "creditSpread": 3.09,
      "ratePath": 0.02,
      "creditSpreadMomentum": -0.64
    },
    "actualReturns": {
      "cnStock": 0.1697,
      "hkStock": 0.1697,
      "usStock": 0.0241,
      "devStock": 0.0628,
      "emStock": 0.0914,
      "bonds_us": -0.0072,
      "precious": 0.092,
      "energy": 0.0568,
      "hedges": 0.1071
    },
    "dataSource": "FRED + Yahoo Finance (Auto)",
    "macroSources": {
      "usd": "Yahoo Finance",
      "vix": "Yahoo Finance",
      "realYield": "FRED:DFII10",
      "fedRate": "FRED:FEDFUNDS",
      "inflation": "FRED:T5YIE",
      "creditSpread": "FRED:BAMLH0A0HYM2",
      "ratePath": "FRED: DGS2 - FEDFUNDS",
      "creditSpreadMomentum": "Calculated: QoQ delta of BAMLH0A0HYM2"
    },
    "returnSources": {
      "cnStock": "Proxy:FXI",
      "hkStock": "Proxy:FXI",
      "usStock": "ETF:SPY",
      "devStock": "ETF:EFA",
      "emStock": "ETF:EEM",
      "bonds_us": "ETF:AGG",
      "precious": "ETF:GLD",
      "energy": "ETF:XLE",
      "hedges": "Proxy:^IRX"
    }
  },
  "quarterly_2006_q2": {
    "period": "2006-Q2",
    "description": "连续季度数据 2006-Q2",
    "quality": "A",
    "macroData": {
      "usd": 85.22,
      "vix": 13.08,
      "cnPolicy": 0.0,
      "cnPolicyTrend": 0.0,
      "momentum": 0.0,
      "adoption": 0.1,
      "btcCycle": 0.3,
      "rateChangeReason": 0.0,
      "usdReason": 0.0,
      "vixReason": 0.0,
      "inflationReason": 0.0,
      "globalGrowth": 3.0,
      "growthTrend": 0.0,
      "inflationTrend": 0.0,
      "usdTrend": 0.0,
      "realYield": 2.56,
      "fedRate": 5.24,
      "inflation": 2.62,
      "creditSpread": 3.33,
      "ratePath": 0.0,
      "creditSpreadMomentum": 0.24
    },
    "actualReturns": {
      "cnStock": -0.0245,
      "hkStock": -0.0245,
      "usStock": -0.0247,
      "devStock": -0.0294,
      "emStock": -0.0964,
      "bonds_us": -0.0068,
      "precious": 0.0543,
      "energy": 0.0245,
      "hedges": 0.0699
    },
    "dataSource": "FRED + Yahoo Finance (Auto)",
    "macroSources": {
      "usd": "Yahoo Finance",
      "vix": "Yahoo Finance",
      "realYield": "FRED:DFII10",
      "fedRate": "FRED:FEDFUNDS",
      "inflation": "FRED:T5YIE",
      "creditSpread": "FRED:BAMLH0A0HYM2",
      "ratePath": "FRED: DGS2 - FEDFUNDS",
      "creditSpreadMomentum": "Calculated: QoQ delta of BAMLH0A0HYM2"
    },
    "returnSources": {
      "cnStock": "Proxy:FXI",
      "hkStock": "Proxy:FXI",
      "usStock": "ETF:SPY",
      "devStock": "ETF:EFA",
      "emStock": "ETF:EEM",
      "bonds_us": "ETF:AGG",
      "precious": "ETF:GLD",
      "energy": "ETF:XLE",
      "hedges": "Proxy:^IRX"
    }
  },
  "quarterly_2006_q3": {
    "period": "2006-Q3",
    "description": "连续季度数据 2006-Q3",
    "quality": "A",
    "macroData": {
      "usd": 85.97,
      "vix": 11.98,
      "cnPolicy": 0.0,
      "cnPolicyTrend": 0.0,
      "momentum": 0.5,
      "adoption": 0.1,
      "btcCycle": 0.3,
      "rateChangeReason": 0.0,
      "usdReason": 0.0,
      "vixReason": 0.0,
      "inflationReason": 0.0,
      "globalGrowth": 3.0,
      "growthTrend": 0.0,
      "inflationTrend": 0.0,
      "usdTrend": 0.0,
      "realYield": 2.29,
      "fedRate": 5.25,
      "inflation": 2.21,
      "creditSpread": 3.43,
      "ratePath": -0.6,
      "creditSpreadMomentum": 0.1
    },
    "actualReturns": {
      "cnStock": 0.0632,
      "hkStock": 0.0632,
      "usStock": 0.0654,
      "devStock": 0.0548,
      "emStock": 0.0448,
      "bonds_us": 0.0426,
      "precious": -0.0968,
      "energy": -0.0809,
      "hedges": -0.0144
    },
    "dataSource": "FRED + Yahoo Finance (Auto)",
    "macroSources": {
      "usd": "Yahoo Finance",
      "vix": "Yahoo Finance",
      "realYield": "FRED:DFII10",
      "fedRate": "FRED:FEDFUNDS",
      "inflation": "FRED:T5YIE",
      "creditSpread": "FRED:BAMLH0A0HYM2",
      "ratePath": "FRED: DGS2 - FEDFUNDS",
      "creditSpreadMomentum": "Calculated: QoQ delta of BAMLH0A0HYM2"
    },
    "returnSources": {
      "cnStock": "Proxy:FXI",
      "hkStock": "Proxy:FXI",
      "usStock": "ETF:SPY",
      "devStock": "ETF:EFA",
      "emStock": "ETF:EEM",
      "bonds_us": "ETF:AGG",
      "precious": "ETF:GLD",
      "energy": "ETF:XLE",
      "hedges": "Proxy:^IRX"
    }
  },
  "quarterly_2006_q4": {
    "period": "2006-Q4",
    "description": "连续季度数据 2006-Q4",
    "quality": "A",
    "macroData": {
      "usd": 83.72,
      "vix": 11.56,
      "cnPolicy": 0.0,
      "cnPolicyTrend": 0.0,
      "momentum": 0.5,
      "adoption": 0.1,
      "btcCycle": 0.3,
      "rateChangeReason": 0.0,
      "usdReason": 0.0,
      "vixReason": 0.0,
      "inflationReason": 0.0,
      "globalGrowth": 3.0,
      "growthTrend": 0.0,
      "inflationTrend": 0.0,
      "usdTrend": 0.0,
      "realYield": 2.36,
      "fedRate": 5.25,
      "inflation": 2.27,
      "creditSpread": 2.91,
      "ratePath": -0.49,
      "vixTermStructure": 1.105,
      "creditSpreadMomentum": -0.52
    },
    "actualReturns": {
      "cnStock": 0.3066,
      "hkStock": 0.3066,
      "usStock": 0.0468,
      "devStock": 0.0823,
      "emStock": 0.1304,
      "bonds_us": 0.0172,
      "precious": 0.0558,
      "energy": 0.0645,
      "hedges": 0.0208
    },
    "dataSource": "FRED + Yahoo Finance (Auto)",
    "macroSources": {
      "usd": "Yahoo Finance",
      "vix": "Yahoo Finance",
      "realYield": "FRED:DFII10",
      "fedRate": "FRED:FEDFUNDS",
      "inflation": "FRED:T5YIE",
      "creditSpread": "FRED:BAMLH0A0HYM2",
      "ratePath": "FRED: DGS2 - FEDFUNDS",
      "vixTermStructure": "Yahoo: ^VIX3M / ^VIX",
      "creditSpreadMomentum": "Calculated: QoQ delta of BAMLH0A0HYM2"
    },
    "returnSources": {
      "cnStock": "Proxy:FXI",
      "hkStock": "Proxy:FXI",
      "usStock": "ETF:SPY",
      "devStock": "ETF:EFA",
      "emStock": "ETF:EEM",
      "bonds_us": "ETF:AGG",
      "precious": "ETF:GLD",
      "energy": "ETF:XLE",
      "hedges": "Proxy:^IRX"
    }
  },
  "quarterly_2007_q1": {
    "period": "2007-Q1",
    "description": "连续季度数据 2007-Q1",
    "quality": "A",
    "macroData": {
      "usd": 82.93,
      "vix": 14.64,
      "cnPolicy": 0.0,
      "cnPolicyTrend": 0.0,
      "momentum": 0.5,
      "adoption": 0.1,
      "btcCycle": 0.3,
      "rateChangeReason": 0.0,
      "usdReason": 0.0,
      "vixReason": 0.0,
      "inflationReason": 0.0,
      "globalGrowth": 3.0,
      "growthTrend": 0.0,
      "inflationTrend": 0.0,
      "usdTrend": 0.0,
      "realYield": 2.25,
      "fedRate": 5.25,
      "inflation": 2.47,
      "creditSpread": 2.83,
      "ratePath": -0.62,
      "vixTermStructure": 1.063,
      "creditSpreadMomentum": -0.08
    },
    "actualReturns": {
      "cnStock": 0.0099,
      "hkStock": 0.0099,
      "usStock": 0.0304,
      "devStock": 0.0767,
      "emStock": 0.0894,
      "bonds_us": 0.0105,
      "precious": 0.1112,
      "energy": 0.1079,
      "agriculture": 0.0164,
      "hedges": -0.0031
    },
    "dataSource": "FRED + Yahoo Finance (Auto)",
    "macroSources": {
      "usd": "Yahoo Finance",
      "vix": "Yahoo Finance",
      "realYield": "FRED:DFII10",
      "fedRate": "FRED:FEDFUNDS",
      "inflation": "FRED:T5YIE",
      "creditSpread": "FRED:BAMLH0A0HYM2",
      "ratePath": "FRED: DGS2 - FEDFUNDS",
      "vixTermStructure": "Yahoo: ^VIX3M / ^VIX",
      "creditSpreadMomentum": "Calculated: QoQ delta of BAMLH0A0HYM2"
    },
    "returnSources": {
      "cnStock": "Proxy:FXI",
      "hkStock": "Proxy:FXI",
      "usStock": "ETF:SPY",
      "devStock": "ETF:EFA",
      "emStock": "ETF:EEM",
      "bonds_us": "ETF:AGG",
      "precious": "ETF:GLD",
      "energy": "ETF:XLE",
      "agriculture": "ETF:DBA",
      "hedges": "Proxy:^IRX"
    }
  },
  "quarterly_2007_q2": {
    "period": "2007-Q2",
    "description": "连续季度数据 2007-Q2",
    "quality": "A",
    "macroData": {
      "usd": 81.92,
      "vix": 16.23,
      "cnPolicy": 0.0,
      "cnPolicyTrend": 0.0,
      "momentum": 0.5,
      "adoption": 0.1,
      "btcCycle": 0.3,
      "rateChangeReason": 0.0,
      "usdReason": 0.0,
      "vixReason": 0.0,
      "inflationReason": 0.0,
      "globalGrowth": 3.0,
      "growthTrend": 0.0,
      "inflationTrend": 0.0,
      "usdTrend": 0.0,
      "realYield": 2.68,
      "fedRate": 5.26,
      "inflation": 2.34,
      "creditSpread": 2.99,
      "ratePath": -0.27,
      "vixTermStructure": 1.041,
      "creditSpreadMomentum": 0.16
    },
    "actualReturns": {
      "cnStock": 0.2477,
      "hkStock": 0.2477,
      "usStock": 0.0596,
      "devStock": 0.0538,
      "emStock": 0.1323,
      "bonds_us": -0.0102,
      "precious": -0.0365,
      "energy": 0.1463,
      "agriculture": 0.037,
      "hedges": 0.0124
    },
    "dataSource": "FRED + Yahoo Finance (Auto)",
    "macroSources": {
      "usd": "Yahoo Finance",
      "vix": "Yahoo Finance",
      "realYield": "FRED:DFII10",
      "fedRate": "FRED:FEDFUNDS",
      "inflation": "FRED:T5YIE",
      "creditSpread": "FRED:BAMLH0A0HYM2",
      "ratePath": "FRED: DGS2 - FEDFUNDS",
      "vixTermStructure": "Yahoo: ^VIX3M / ^VIX",
      "creditSpreadMomentum": "Calculated: QoQ delta of BAMLH0A0HYM2"
    },
    "returnSources": {
      "cnStock": "Proxy:FXI",
      "hkStock": "Proxy:FXI",
      "usStock": "ETF:SPY",
      "devStock": "ETF:EFA",
      "emStock": "ETF:EEM",
      "bonds_us": "ETF:AGG",
      "precious": "ETF:GLD",
      "energy": "ETF:XLE",
      "agriculture": "ETF:DBA",
      "hedges": "ETF:SHV"
    }
  },
  "quarterly_2007_q3": {
    "period": "2007-Q3",
    "description": "连续季度数据 2007-Q3",
    "quality": "A",
    "macroData": {
      "usd": 77.72,
      "vix": 18.0,
      "cnPolicy": 0.0,
      "cnPolicyTrend": 0.0,
      "momentum": 0.0,
      "adoption": 0.1,
      "btcCycle": 0.3,
      "rateChangeReason": 0.0,
      "usdReason": 0.0,
      "vixReason": 0.0,
      "inflationReason": 0.0,
      "globalGrowth": 3.0,
      "growthTrend": 0.0,
      "inflationTrend": 0.0,
      "usdTrend": 0.0,
      "realYield": 2.25,
      "fedRate": 4.76,
      "inflation": 2.13,
      "creditSpread": 4.16,
      "ratePath": -0.68,
      "vixTermStructure": 1.085,
      "creditSpreadMomentum": 1.17
    },
    "actualReturns": {
      "cnStock": 0.4001,
      "hkStock": 0.4001,
      "usStock": 0.0236,
      "devStock": 0.0205,
      "emStock": 0.1357,
      "bonds_us": 0.027,
      "precious": 0.1299,
      "energy": 0.0527,
      "agriculture": 0.064,
      "hedges": 0.0138
    },
    "dataSource": "FRED + Yahoo Finance (Auto)",
    "macroSources": {
      "usd": "Yahoo Finance",
      "vix": "Yahoo Finance",
      "realYield": "FRED:DFII10",
      "fedRate": "FRED:FEDFUNDS",
      "inflation": "FRED:T5YIE",
      "creditSpread": "FRED:BAMLH0A0HYM2",
      "ratePath": "FRED: DGS2 - FEDFUNDS",
      "vixTermStructure": "Yahoo: ^VIX3M / ^VIX",
      "creditSpreadMomentum": "Calculated: QoQ delta of BAMLH0A0HYM2"
    },
    "returnSources": {
      "cnStock": "Proxy:FXI",
      "hkStock": "Proxy:FXI",
      "usStock": "ETF:SPY",
      "devStock": "ETF:EFA",
      "emStock": "ETF:EEM",
      "bonds_us": "ETF:AGG",
      "precious": "ETF:GLD",
      "energy": "ETF:XLE",
      "agriculture": "ETF:DBA",
      "hedges": "ETF:SHV"
    }
  },
  "quarterly_2007_q4": {
    "period": "2007-Q4",
    "description": "连续季度数据 2007-Q4",
    "quality": "A",
    "macroData": {
      "usd": 76.7,
      "vix": 22.5,
      "cnPolicy": 0.0,
      "cnPolicyTrend": 0.0,
      "momentum": -0.8,
      "adoption": 0.1,
      "btcCycle": 0.3,
      "rateChangeReason": 0.0,
      "usdReason": 0.0,
      "vixReason": 0.0,
      "inflationReason": 0.0,
      "globalGrowth": 3.0,
      "growthTrend": 0.0,
      "inflationTrend": 0.0,
      "usdTrend": 0.0,
      "realYield": 1.58,
      "fedRate": 3.94,
      "inflation": 2.28,
      "creditSpread": 6.17,
      "ratePath": -1.2,
      "vixTermStructure": 0.99,
      "creditSpreadMomentum": 2.01
    },
    "actualReturns": {
      "cnStock": -0.1359,
      "hkStock": -0.1359,
      "usStock": -0.0885,
      "devStock": -0.0674,
      "emStock": -0.0671,
      "bonds_us": 0.0457,
      "precious": 0.1598,
      "energy": 0.0345,
      "agriculture": 0.234,
      "hedges": 0.0128
    },
    "dataSource": "FRED + Yahoo Finance (Auto)",
    "macroSources": {
      "usd": "Yahoo Finance",
      "vix": "Yahoo Finance",
      "realYield": "FRED:DFII10",
      "fedRate": "FRED:FEDFUNDS",
      "inflation": "FRED:T5YIE",
      "creditSpread": "FRED:BAMLH0A0HYM2",
      "ratePath": "FRED: DGS2 - FEDFUNDS",
      "vixTermStructure": "Yahoo: ^VIX3M / ^VIX",
      "creditSpreadMomentum": "Calculated: QoQ delta of BAMLH0A0HYM2"
    },
    "returnSources": {
      "cnStock": "Proxy:FXI",
      "hkStock": "Proxy:FXI",
      "usStock": "ETF:SPY",
      "devStock": "ETF:EFA",
      "emStock": "ETF:EEM",
      "bonds_us": "ETF:AGG",
      "precious": "ETF:GLD",
      "energy": "ETF:XLE",
      "agriculture": "ETF:DBA",
      "hedges": "ETF:SHV"
    }
  },
  "quarterly_2008_q1": {
    "period": "2008-Q1",
    "description": "连续季度数据 2008-Q1",
    "quality": "A",
    "macroData": {
      "usd": 71.8,
      "vix": 25.61,
      "cnPolicy": 0.0,
      "cnPolicyTrend": 0.0,
      "momentum": 0.0,
      "adoption": 0.1,
      "btcCycle": 0.3,
      "rateChangeReason": 0.0,
      "usdReason": 0.0,
      "vixReason": 0.0,
      "inflationReason": 0.0,
      "globalGrowth": 3.0,
      "growthTrend": 0.0,
      "inflationTrend": 0.0,
      "usdTrend": 0.0,
      "realYield": 1.28,
      "fedRate": 2.28,
      "inflation": 2.21,
      "creditSpread": 7.78,
      "ratePath": -0.45,
      "vixTermStructure": 1.048,
      "creditSpreadMomentum": 1.61
    },
    "actualReturns": {
      "cnStock": -0.104,
      "hkStock": -0.104,
      "usStock": -0.0265,
      "devStock": -0.0231,
      "emStock": -0.027,
      "bonds_us": 0.0151,
      "bonds_global": 0.0655,
      "precious": 0.0601,
      "energy": 0.0004,
      "agriculture": 0.111,
      "hedges": 0.0109
    },
    "dataSource": "FRED + Yahoo Finance (Auto)",
    "macroSources": {
      "usd": "Yahoo Finance",
      "vix": "Yahoo Finance",
      "realYield": "FRED:DFII10",
      "fedRate": "FRED:FEDFUNDS",
      "inflation": "FRED:T5YIE",
      "creditSpread": "FRED:BAMLH0A0HYM2",
      "ratePath": "FRED: DGS2 - FEDFUNDS",
      "vixTermStructure": "Yahoo: ^VIX3M / ^VIX",
      "creditSpreadMomentum": "Calculated: QoQ delta of BAMLH0A0HYM2"
    },
    "returnSources": {
      "cnStock": "Proxy:FXI",
      "hkStock": "Proxy:FXI",
      "usStock": "ETF:SPY",
      "devStock": "ETF:EFA",
      "emStock": "ETF:EEM",
      "bonds_us": "ETF:AGG",
      "bonds_global": "Proxy:BWX",
      "precious": "ETF:GLD",
      "energy": "ETF:XLE",
      "agriculture": "ETF:DBA",
      "hedges": "ETF:SHV"
    }
  },
  "quarterly_2008_q2": {
    "period": "2008-Q2",
    "description": "连续季度数据 2008-Q2",
    "quality": "A",
    "macroData": {
      "usd": 72.46,
      "vix": 23.95,
      "cnPolicy": 0.0,
      "cnPolicyTrend": 0.0,
      "momentum": -0.5,
      "adoption": 0.1,
      "btcCycle": 0.3,
      "rateChangeReason": 0.0,
      "usdReason": 0.0,
      "vixReason": 0.0,
      "inflationReason": 0.0,
      "globalGrowth": 3.0,
      "growthTrend": 0.0,
      "inflationTrend": 0.0,
      "usdTrend": 0.0,
      "realYield": 1.42,
      "fedRate": 2.01,
      "inflation": 2.72,
      "creditSpread": 7.63,
      "ratePath": NaN,
      "vixTermStructure": 0.985,
      "creditSpreadMomentum": -0.15
    },
    "actualReturns": {
      "cnStock": -0.132,
      "hkStock": -0.132,
      "usStock": -0.0727,
      "devStock": -0.0835,
      "emStock": -0.0722,
      "bonds_us": -0.0174,
      "bonds_global": -0.0317,
      "precious": 0.0201,
      "energy": 0.1011,
      "agriculture": 0.094,
      "hedges": 0.0032
    },
    "dataSource": "FRED + Yahoo Finance (Auto)",
    "macroSources": {
      "usd": "Yahoo Finance",
      "vix": "Yahoo Finance",
      "realYield": "FRED:DFII10",
      "fedRate": "FRED:FEDFUNDS",
      "inflation": "FRED:T5YIE",
      "creditSpread": "FRED:BAMLH0A0HYM2",
      "ratePath": "FRED: DGS2 - FEDFUNDS",
      "vixTermStructure": "Yahoo: ^VIX3M / ^VIX",
      "creditSpreadMomentum": "Calculated: QoQ delta of BAMLH0A0HYM2"
    },
    "returnSources": {
      "cnStock": "Proxy:FXI",
      "hkStock": "Proxy:FXI",
      "usStock": "ETF:SPY",
      "devStock": "ETF:EFA",
      "emStock": "ETF:EEM",
      "bonds_us": "ETF:AGG",
      "bonds_global": "Proxy:BWX",
      "precious": "ETF:GLD",
      "energy": "ETF:XLE",
      "agriculture": "ETF:DBA",
      "hedges": "ETF:SHV"
    }
  },
  "quarterly_2008_q3": {
    "period": "2008-Q3",
    "description": "连续季度数据 2008-Q3",
    "quality": "A",
    "macroData": {
      "usd": 79.45,
      "vix": 39.39,
      "cnPolicy": 0.5,
      "cnPolicyTrend": 0.0,
      "momentum": -0.8,
      "adoption": 0.1,
      "btcCycle": 0.3,
      "rateChangeReason": 0.0,
      "usdReason": 0.0,
      "vixReason": 0.0,
      "inflationReason": 0.0,
      "globalGrowth": 3.0,
      "growthTrend": 0.0,
      "inflationTrend": 0.0,
      "usdTrend": 0.0,
      "realYield": 2.18,
      "fedRate": 0.97,
      "inflation": 0.96,
      "creditSpread": 12.24,
      "ratePath": 0.63,
      "vixTermStructure": 0.826,
      "creditSpreadMomentum": 4.61
    },
    "actualReturns": {
      "cnStock": -0.2283,
      "hkStock": -0.2283,
      "usStock": -0.1214,
      "devStock": -0.2088,
      "emStock": -0.2863,
      "bonds_us": 0.0022,
      "bonds_global": -0.0509,
      "precious": -0.1029,
      "energy": -0.3145,
      "agriculture": -0.331,
      "hedges": 0.0078
    },
    "dataSource": "FRED + Yahoo Finance (Auto)",
    "macroSources": {
      "usd": "Yahoo Finance",
      "vix": "Yahoo Finance",
      "realYield": "FRED:DFII10",
      "fedRate": "FRED:FEDFUNDS",
      "inflation": "FRED:T5YIE",
      "creditSpread": "FRED:BAMLH0A0HYM2",
      "cnPolicy": "Manual Override: 0.5",
      "ratePath": "FRED: DGS2 - FEDFUNDS",
      "vixTermStructure": "Yahoo: ^VIX3M / ^VIX",
      "creditSpreadMomentum": "Calculated: QoQ delta of BAMLH0A0HYM2"
    },
    "returnSources": {
      "cnStock": "Proxy:FXI",
      "hkStock": "Proxy:FXI",
      "usStock": "ETF:SPY",
      "devStock": "ETF:EFA",
      "emStock": "ETF:EEM",
      "bonds_us": "ETF:AGG",
      "bonds_global": "Proxy:BWX",
      "precious": "ETF:GLD",
      "energy": "ETF:XLE",
      "agriculture": "ETF:DBA",
      "hedges": "ETF:SHV"
    }
  },
  "quarterly_2008_q4": {
    "period": "2008-Q4",
    "description": "连续季度数据 2008-Q4",
    "quality": "A",
    "macroData": {
      "usd": 81.31,
      "vix": 40.0,
      "cnPolicy": 1.0,
      "cnPolicyTrend": 0.0,
      "momentum": -0.8,
      "adoption": 0.1,
      "btcCycle": 0.3,
      "rateChangeReason": 0.0,
      "usdReason": 0.0,
      "vixReason": 0.0,
      "inflationReason": 0.0,
      "globalGrowth": 3.0,
      "growthTrend": 0.0,
      "inflationTrend": 0.0,
      "usdTrend": 0.0,
      "realYield": 2.29,
      "fedRate": 0.15,
      "inflation": -0.25,
      "creditSpread": 17.84,
      "ratePath": 0.63,
      "vixTermStructure": 1.045,
      "creditSpreadMomentum": 5.6
    },
    "actualReturns": {
      "cnStock": 0.0523,
      "hkStock": 0.0523,
      "usStock": -0.1062,
      "devStock": -0.0984,
      "emStock": -0.0541,
      "bonds_us": 0.0792,
      "bonds_global": 0.0258,
      "precious": 0.0024,
      "energy": -0.06,
      "agriculture": 0.0437,
      "hedges": 0.0044
    },
    "dataSource": "FRED + Yahoo Finance (Auto)",
    "macroSources": {
      "usd": "Yahoo Finance",
      "vix": "Yahoo Finance",
      "realYield": "FRED:DFII10",
      "fedRate": "FRED:FEDFUNDS",
      "inflation": "FRED:T5YIE",
      "creditSpread": "FRED:BAMLH0A0HYM2",
      "cnPolicy": "Manual Override: 1.0",
      "ratePath": "FRED: DGS2 - FEDFUNDS",
      "vixTermStructure": "Yahoo: ^VIX3M / ^VIX",
      "creditSpreadMomentum": "Calculated: QoQ delta of BAMLH0A0HYM2"
    },
    "returnSources": {
      "cnStock": "Proxy:FXI",
      "hkStock": "Proxy:FXI",
      "usStock": "ETF:SPY",
      "devStock": "ETF:EFA",
      "emStock": "ETF:EEM",
      "bonds_us": "ETF:AGG",
      "bonds_global": "Proxy:BWX",
      "precious": "ETF:GLD",
      "energy": "ETF:XLE",
      "agriculture": "ETF:DBA",
      "hedges": "ETF:SHV"
    }
  },
  "quarterly_2009_q1": {
    "period": "2009-Q1",
    "description": "连续季度数据 2009-Q1",
    "quality": "A",
    "macroData": {
      "usd": 85.43,
      "vix": 44.14,
      "cnPolicy": 1.0,
      "cnPolicyTrend": 0.0,
      "momentum": -0.8,
      "adoption": 0.1,
      "btcCycle": 0.3,
      "rateChangeReason": 0.0,
      "usdReason": 0.0,
      "vixReason": 0.0,
      "inflationReason": 0.0,
      "globalGrowth": 3.0,
      "growthTrend": 0.0,
      "inflationTrend": 0.0,
      "usdTrend": 0.0,
      "realYield": 1.53,
      "fedRate": 0.15,
      "inflation": 0.8,
      "creditSpread": 16.53,
      "ratePath": 0.81,
      "vixTermStructure": 1.035,
      "creditSpreadMomentum": -1.31
    },
    "actualReturns": {
      "cnStock": -0.0193,
      "hkStock": -0.0193,
      "usStock": -0.0921,
      "devStock": -0.1029,
      "emStock": 0.0092,
      "bonds_us": -0.0301,
      "bonds_global": -0.0088,
      "precious": 0.0289,
      "energy": -0.1086,
      "agriculture": -0.0792,
      "hedges": 0.0002
    },
    "dataSource": "FRED + Yahoo Finance (Auto)",
    "macroSources": {
      "usd": "Yahoo Finance",
      "vix": "Yahoo Finance",
      "realYield": "FRED:DFII10",
      "fedRate": "FRED:FEDFUNDS",
      "inflation": "FRED:T5YIE",
      "creditSpread": "FRED:BAMLH0A0HYM2",
      "cnPolicy": "Manual Override: 1.0",
      "ratePath": "FRED: DGS2 - FEDFUNDS",
      "vixTermStructure": "Yahoo: ^VIX3M / ^VIX",
      "creditSpreadMomentum": "Calculated: QoQ delta of BAMLH0A0HYM2"
    },
    "returnSources": {
      "cnStock": "Proxy:FXI",
      "hkStock": "Proxy:FXI",
      "usStock": "ETF:SPY",
      "devStock": "ETF:EFA",
      "emStock": "ETF:EEM",
      "bonds_us": "ETF:AGG",
      "bonds_global": "Proxy:BWX",
      "precious": "ETF:GLD",
      "energy": "ETF:XLE",
      "agriculture": "ETF:DBA",
      "hedges": "ETF:SHV"
    }
  },
  "quarterly_2009_q2": {
    "period": "2009-Q2",
    "description": "连续季度数据 2009-Q2",
    "quality": "A",
    "macroData": {
      "usd": 80.13,
      "vix": 26.35,
      "cnPolicy": 0.8,
      "cnPolicyTrend": 0.0,
      "momentum": 0.8,
      "adoption": 0.1,
      "btcCycle": 0.3,
      "rateChangeReason": 0.0,
      "usdReason": 0.0,
      "vixReason": 0.0,
      "inflationReason": 0.0,
      "globalGrowth": 3.0,
      "growthTrend": 0.0,
      "inflationTrend": 0.0,
      "usdTrend": 0.0,
      "realYield": 1.87,
      "fedRate": 0.16,
      "inflation": 1.27,
      "creditSpread": 10.52,
      "ratePath": NaN,
      "vixTermStructure": 1.092,
      "creditSpreadMomentum": -6.01
    },
    "actualReturns": {
      "cnStock": 0.2223,
      "hkStock": 0.2223,
      "usStock": 0.0804,
      "devStock": 0.1635,
      "emStock": 0.1914,
      "bonds_us": 0.0259,
      "bonds_global": 0.0682,
      "precious": 0.0701,
      "energy": 0.029,
      "agriculture": 0.0105,
      "hedges": 0.0007
    },
    "dataSource": "FRED + Yahoo Finance (Auto)",
    "macroSources": {
      "usd": "Yahoo Finance",
      "vix": "Yahoo Finance",
      "realYield": "FRED:DFII10",
      "fedRate": "FRED:FEDFUNDS",
      "inflation": "FRED:T5YIE",
      "creditSpread": "FRED:BAMLH0A0HYM2",
      "cnPolicy": "Manual Override: 0.8",
      "ratePath": "FRED: DGS2 - FEDFUNDS",
      "vixTermStructure": "Yahoo: ^VIX3M / ^VIX",
      "creditSpreadMomentum": "Calculated: QoQ delta of BAMLH0A0HYM2"
    },
    "returnSources": {
      "cnStock": "Proxy:FXI",
      "hkStock": "Proxy:FXI",
      "usStock": "ETF:SPY",
      "devStock": "ETF:EFA",
      "emStock": "ETF:EEM",
      "bonds_us": "ETF:AGG",
      "bonds_global": "Proxy:BWX",
      "precious": "ETF:GLD",
      "energy": "ETF:XLE",
      "agriculture": "ETF:DBA",
      "hedges": "ETF:SHV"
    }
  },
  "quarterly_2009_q3": {
    "period": "2009-Q3",
    "description": "连续季度数据 2009-Q3",
    "quality": "A",
    "macroData": {
      "usd": 76.65,
      "vix": 25.61,
      "cnPolicy": 0.0,
      "cnPolicyTrend": 0.0,
      "momentum": 0.8,
      "adoption": 0.1,
      "btcCycle": 0.3,
      "rateChangeReason": 0.0,
      "usdReason": 0.0,
      "vixReason": 0.0,
      "inflationReason": 0.0,
      "globalGrowth": 3.0,
      "growthTrend": 0.0,
      "inflationTrend": 0.0,
      "usdTrend": 0.0,
      "realYield": 1.54,
      "fedRate": 0.12,
      "inflation": 1.33,
      "creditSpread": 8.2,
      "ratePath": 0.76,
      "vixTermStructure": 1.029,
      "creditSpreadMomentum": -2.32
    },
    "actualReturns": {
      "cnStock": 0.0603,
      "hkStock": 0.0603,
      "usStock": 0.1639,
      "devStock": 0.1795,
      "emStock": 0.2163,
      "bonds_us": 0.0371,
      "bonds_global": 0.0662,
      "precious": 0.0998,
      "energy": 0.1678,
      "agriculture": 0.0156,
      "hedges": 0.0006
    },
    "dataSource": "FRED + Yahoo Finance (Auto)",
    "macroSources": {
      "usd": "Yahoo Finance",
      "vix": "Yahoo Finance",
      "realYield": "FRED:DFII10",
      "fedRate": "FRED:FEDFUNDS",
      "inflation": "FRED:T5YIE",
      "creditSpread": "FRED:BAMLH0A0HYM2",
      "ratePath": "FRED: DGS2 - FEDFUNDS",
      "vixTermStructure": "Yahoo: ^VIX3M / ^VIX",
      "creditSpreadMomentum": "Calculated: QoQ delta of BAMLH0A0HYM2"
    },
    "returnSources": {
      "cnStock": "Proxy:FXI",
      "hkStock": "Proxy:FXI",
      "usStock": "ETF:SPY",
      "devStock": "ETF:EFA",
      "emStock": "ETF:EEM",
      "bonds_us": "ETF:AGG",
      "bonds_global": "Proxy:BWX",
      "precious": "ETF:GLD",
      "energy": "ETF:XLE",
      "agriculture": "ETF:DBA",
      "hedges": "ETF:SHV"
    }
  },
  "quarterly_2009_q4": {
    "period": "2009-Q4",
    "description": "连续季度数据 2009-Q4",
    "quality": "A",
    "macroData": {
      "usd": 77.86,
      "vix": 21.68,
      "cnPolicy": 0.0,
      "cnPolicyTrend": 0.0,
      "momentum": 0.8,
      "adoption": 0.1,
      "btcCycle": 0.3,
      "rateChangeReason": 0.0,
      "usdReason": 0.0,
      "vixReason": 0.0,
      "inflationReason": 0.0,
      "globalGrowth": 3.0,
      "growthTrend": 0.0,
      "inflationTrend": 0.0,
      "usdTrend": 0.0,
      "realYield": 1.48,
      "fedRate": 0.11,
      "inflation": 2.13,
      "creditSpread": 6.39,
      "ratePath": 0.9,
      "vixTermStructure": 1.157,
      "creditSpreadMomentum": -1.81
    },
    "actualReturns": {
      "cnStock": 0.0659,
      "hkStock": 0.0659,
      "usStock": 0.0828,
      "devStock": 0.0548,
      "emStock": 0.1016,
      "bonds_us": 0.0021,
      "bonds_global": -0.0191,
      "precious": 0.0725,
      "energy": 0.0962,
      "agriculture": 0.0731,
      "hedges": 0.0001
    },
    "dataSource": "FRED + Yahoo Finance (Auto)",
    "macroSources": {
      "usd": "Yahoo Finance",
      "vix": "Yahoo Finance",
      "realYield": "FRED:DFII10",
      "fedRate": "FRED:FEDFUNDS",
      "inflation": "FRED:T5YIE",
      "creditSpread": "FRED:BAMLH0A0HYM2",
      "ratePath": "FRED: DGS2 - FEDFUNDS",
      "vixTermStructure": "Yahoo: ^VIX3M / ^VIX",
      "creditSpreadMomentum": "Calculated: QoQ delta of BAMLH0A0HYM2"
    },
    "returnSources": {
      "cnStock": "Proxy:FXI",
      "hkStock": "Proxy:FXI",
      "usStock": "ETF:SPY",
      "devStock": "ETF:EFA",
      "emStock": "ETF:EEM",
      "bonds_us": "ETF:AGG",
      "bonds_global": "Proxy:BWX",
      "precious": "ETF:GLD",
      "energy": "ETF:XLE",
      "agriculture": "ETF:DBA",
      "hedges": "ETF:SHV"
    }
  },
  "quarterly_2010_q1": {
    "period": "2010-Q1",
    "description": "连续季度数据 2010-Q1",
    "quality": "A",
    "macroData": {
      "usd": 81.07,
      "vix": 17.59,
      "cnPolicy": 0.0,
      "cnPolicyTrend": 0.0,
      "momentum": 0.5,
      "adoption": 0.3,
      "btcCycle": 0.3,
      "rateChangeReason": 0.0,
      "usdReason": 0.0,
      "vixReason": 0.0,
      "inflationReason": 0.0,
      "globalGrowth": 3.0,
      "growthTrend": 0.0,
      "inflationTrend": 0.0,
      "usdTrend": 0.0,
      "realYield": 1.69,
      "fedRate": 0.2,
      "inflation": 1.86,
      "creditSpread": 5.82,
      "ratePath": 0.98,
      "vixTermStructure": 1.137,
      "creditSpreadMomentum": -0.57
    },
    "actualReturns": {
      "cnStock": -0.0173,
      "hkStock": -0.0173,
      "usStock": 0.0487,
      "devStock": 0.0002,
      "emStock": 0.0116,
      "bonds_us": 0.0043,
      "bonds_global": -0.0228,
      "precious": -0.0056,
      "energy": -0.0035,
      "agriculture": -0.0926,
      "hedges": -0.0001
    },
    "dataSource": "FRED + Yahoo Finance (Auto)",
    "macroSources": {
      "usd": "Yahoo Finance",
      "vix": "Yahoo Finance",
      "realYield": "FRED:DFII10",
      "fedRate": "FRED:FEDFUNDS",
      "inflation": "FRED:T5YIE",
      "creditSpread": "FRED:BAMLH0A0HYM2",
      "ratePath": "FRED: DGS2 - FEDFUNDS",
      "vixTermStructure": "Yahoo: ^VIX3M / ^VIX",
      "creditSpreadMomentum": "Calculated: QoQ delta of BAMLH0A0HYM2"
    },
    "returnSources": {
      "cnStock": "Proxy:FXI",
      "hkStock": "Proxy:FXI",
      "usStock": "ETF:SPY",
      "devStock": "ETF:EFA",
      "emStock": "ETF:EEM",
      "bonds_us": "ETF:AGG",
      "bonds_global": "Proxy:BWX",
      "precious": "ETF:GLD",
      "energy": "ETF:XLE",
      "agriculture": "ETF:DBA",
      "hedges": "ETF:SHV"
    }
  },
  "quarterly_2010_q2": {
    "period": "2010-Q2",
    "description": "连续季度数据 2010-Q2",
    "quality": "A",
    "macroData": {
      "usd": 86.02,
      "vix": 34.54,
      "cnPolicy": 0.0,
      "cnPolicyTrend": 0.0,
      "momentum": -0.8,
      "adoption": 0.3,
      "btcCycle": 0.3,
      "rateChangeReason": 0.0,
      "usdReason": 0.0,
      "vixReason": 0.0,
      "inflationReason": 0.0,
      "globalGrowth": 3.0,
      "growthTrend": 0.0,
      "inflationTrend": 0.0,
      "usdTrend": 0.0,
      "realYield": 1.27,
      "fedRate": 0.18,
      "inflation": 1.48,
      "creditSpread": 7.13,
      "ratePath": NaN,
      "vixTermStructure": 1.105,
      "creditSpreadMomentum": 1.31
    },
    "actualReturns": {
      "cnStock": -0.0998,
      "hkStock": -0.0998,
      "usStock": -0.1374,
      "devStock": -0.1575,
      "emStock": -0.1312,
      "bonds_us": 0.0422,
      "bonds_global": -0.0196,
      "precious": 0.0672,
      "energy": -0.1674,
      "agriculture": -0.0143,
      "hedges": 0.0004
    },
    "dataSource": "FRED + Yahoo Finance (Auto)",
    "macroSources": {
      "usd": "Yahoo Finance",
      "vix": "Yahoo Finance",
      "realYield": "FRED:DFII10",
      "fedRate": "FRED:FEDFUNDS",
      "inflation": "FRED:T5YIE",
      "creditSpread": "FRED:BAMLH0A0HYM2",
      "ratePath": "FRED: DGS2 - FEDFUNDS",
      "vixTermStructure": "Yahoo: ^VIX3M / ^VIX",
      "creditSpreadMomentum": "Calculated: QoQ delta of BAMLH0A0HYM2"
    },
    "returnSources": {
      "cnStock": "Proxy:FXI",
      "hkStock": "Proxy:FXI",
      "usStock": "ETF:SPY",
      "devStock": "ETF:EFA",
      "emStock": "ETF:EEM",
      "bonds_us": "ETF:AGG",
      "bonds_global": "Proxy:BWX",
      "precious": "ETF:GLD",
      "energy": "ETF:XLE",
      "agriculture": "ETF:DBA",
      "hedges": "ETF:SHV"
    }
  },
  "quarterly_2010_q3": {
    "period": "2010-Q3",
    "description": "连续季度数据 2010-Q3",
    "quality": "A",
    "macroData": {
      "usd": 78.72,
      "vix": 23.7,
      "cnPolicy": 0.0,
      "cnPolicyTrend": 0.0,
      "momentum": 0.8,
      "adoption": 0.3,
      "btcCycle": 0.3,
      "rateChangeReason": 0.0,
      "usdReason": 0.0,
      "vixReason": 0.0,
      "inflationReason": 0.0,
      "globalGrowth": 3.0,
      "growthTrend": 0.0,
      "inflationTrend": 0.0,
      "usdTrend": 0.0,
      "realYield": 0.75,
      "fedRate": 0.19,
      "inflation": 1.33,
      "creditSpread": 6.22,
      "ratePath": 0.22,
      "vixTermStructure": 1.153,
      "creditSpreadMomentum": -0.91
    },
    "actualReturns": {
      "cnStock": 0.1134,
      "hkStock": 0.1134,
      "usStock": 0.1341,
      "devStock": 0.1705,
      "emStock": 0.1992,
      "bonds_us": 0.0209,
      "bonds_global": 0.1145,
      "precious": 0.1243,
      "energy": 0.1569,
      "industrial": 0.5156,
      "agriculture": 0.1285,
      "hedges": 0.0006
    },
    "dataSource": "FRED + Yahoo Finance (Auto)",
    "macroSources": {
      "usd": "Yahoo Finance",
      "vix": "Yahoo Finance",
      "realYield": "FRED:DFII10",
      "fedRate": "FRED:FEDFUNDS",
      "inflation": "FRED:T5YIE",
      "creditSpread": "FRED:BAMLH0A0HYM2",
      "ratePath": "FRED: DGS2 - FEDFUNDS",
      "vixTermStructure": "Yahoo: ^VIX3M / ^VIX",
      "creditSpreadMomentum": "Calculated: QoQ delta of BAMLH0A0HYM2"
    },
    "returnSources": {
      "cnStock": "Proxy:FXI",
      "hkStock": "Proxy:FXI",
      "usStock": "ETF:SPY",
      "devStock": "ETF:EFA",
      "emStock": "ETF:EEM",
      "bonds_us": "ETF:AGG",
      "bonds_global": "Proxy:BWX",
      "precious": "ETF:GLD",
      "energy": "ETF:XLE",
      "industrial": "ETF:COPX",
      "agriculture": "ETF:DBA",
      "hedges": "ETF:SHV"
    }
  },
  "quarterly_2010_q4": {
    "period": "2010-Q4",
    "description": "连续季度数据 2010-Q4",
    "quality": "A",
    "macroData": {
      "usd": 79.03,
      "vix": 17.75,
      "cnPolicy": 0.0,
      "cnPolicyTrend": 0.0,
      "momentum": 0.8,
      "adoption": 0.3,
      "btcCycle": 0.3,
      "rateChangeReason": 0.0,
      "usdReason": 0.0,
      "vixReason": 0.0,
      "inflationReason": 0.0,
      "globalGrowth": 3.0,
      "growthTrend": 0.0,
      "inflationTrend": 0.0,
      "usdTrend": 0.0,
      "realYield": 1.05,
      "fedRate": 0.17,
      "inflation": 1.82,
      "creditSpread": 5.32,
      "ratePath": 0.54,
      "vixTermStructure": 1.178,
      "creditSpreadMomentum": -0.9
    },
    "actualReturns": {
      "cnStock": 0.0058,
      "hkStock": 0.0058,
      "usStock": 0.1058,
      "devStock": 0.0375,
      "emStock": 0.0545,
      "bonds_us": -0.0206,
      "bonds_global": -0.0609,
      "precious": 0.0194,
      "energy": 0.1867,
      "industrial": 0.1957,
      "agriculture": 0.1926,
      "hedges": 0.0004
    },
    "dataSource": "FRED + Yahoo Finance (Auto)",
    "macroSources": {
      "usd": "Yahoo Finance",
      "vix": "Yahoo Finance",
      "realYield": "FRED:DFII10",
      "fedRate": "FRED:FEDFUNDS",
      "inflation": "FRED:T5YIE",
      "creditSpread": "FRED:BAMLH0A0HYM2",
      "ratePath": "FRED: DGS2 - FEDFUNDS",
      "vixTermStructure": "Yahoo: ^VIX3M / ^VIX",
      "creditSpreadMomentum": "Calculated: QoQ delta of BAMLH0A0HYM2"
    },
    "returnSources": {
      "cnStock": "Proxy:FXI",
      "hkStock": "Proxy:FXI",
      "usStock": "ETF:SPY",
      "devStock": "ETF:EFA",
      "emStock": "ETF:EEM",
      "bonds_us": "ETF:AGG",
      "bonds_global": "Proxy:BWX",
      "precious": "ETF:GLD",
      "energy": "ETF:XLE",
      "industrial": "ETF:COPX",
      "agriculture": "ETF:DBA",
      "hedges": "ETF:SHV"
    }
  },
  "quarterly_2011_q1": {
    "period": "2011-Q1",
    "description": "连续季度数据 2011-Q1",
    "quality": "A",
    "macroData": {
      "usd": 75.86,
      "vix": 17.74,
      "cnPolicy": 0.0,
      "cnPolicyTrend": 0.0,
      "momentum": 0.5,
      "adoption": 0.3,
      "btcCycle": 0.3,
      "rateChangeReason": 0.0,
      "usdReason": 0.0,
      "vixReason": 0.0,
      "inflationReason": 0.0,
      "globalGrowth": 3.0,
      "growthTrend": 0.0,
      "inflationTrend": 0.0,
      "usdTrend": 0.0,
      "realYield": 0.94,
      "fedRate": 0.1,
      "inflation": 2.25,
      "creditSpread": 4.72,
      "ratePath": 0.74,
      "vixTermStructure": 1.125,
      "creditSpreadMomentum": -0.6
    },
    "actualReturns": {
      "cnStock": 0.0462,
      "hkStock": 0.0462,
      "usStock": 0.0505,
      "devStock": 0.0517,
      "emStock": 0.0436,
      "bonds_us": 0.0062,
      "bonds_global": 0.0455,
      "precious": 0.0614,
      "energy": 0.1882,
      "industrial": 0.0634,
      "agriculture": 0.0941,
      "hedges": -0.0
    },
    "dataSource": "FRED + Yahoo Finance (Auto)",
    "macroSources": {
      "usd": "Yahoo Finance",
      "vix": "Yahoo Finance",
      "realYield": "FRED:DFII10",
      "fedRate": "FRED:FEDFUNDS",
      "inflation": "FRED:T5YIE",
      "creditSpread": "FRED:BAMLH0A0HYM2",
      "ratePath": "FRED: DGS2 - FEDFUNDS",
      "vixTermStructure": "Yahoo: ^VIX3M / ^VIX",
      "creditSpreadMomentum": "Calculated: QoQ delta of BAMLH0A0HYM2"
    },
    "returnSources": {
      "cnStock": "Proxy:FXI",
      "hkStock": "Proxy:FXI",
      "usStock": "ETF:SPY",
      "devStock": "ETF:EFA",
      "emStock": "ETF:EEM",
      "bonds_us": "ETF:AGG",
      "bonds_global": "Proxy:BWX",
      "precious": "ETF:GLD",
      "energy": "ETF:XLE",
      "industrial": "ETF:COPX",
      "agriculture": "ETF:DBA",
      "hedges": "ETF:SHV"
    }
  },
  "quarterly_2011_q2": {
    "period": "2011-Q2",
    "description": "连续季度数据 2011-Q2",
    "quality": "A",
    "macroData": {
      "usd": 74.3,
      "vix": 16.52,
      "cnPolicy": -0.5,
      "cnPolicyTrend": 0.0,
      "momentum": 0.0,
      "adoption": 0.3,
      "btcCycle": 0.3,
      "rateChangeReason": 0.0,
      "usdReason": 0.0,
      "vixReason": 0.0,
      "inflationReason": 0.0,
      "globalGrowth": 3.0,
      "growthTrend": 0.0,
      "inflationTrend": 0.0,
      "usdTrend": 0.0,
      "realYield": 0.77,
      "fedRate": 0.07,
      "inflation": 2.05,
      "creditSpread": 5.34,
      "ratePath": 0.37,
      "vixTermStructure": 1.128,
      "creditSpreadMomentum": 0.62
    },
    "actualReturns": {
      "cnStock": -0.0518,
      "hkStock": -0.0376,
      "usStock": 0.0061,
      "devStock": 0.0087,
      "emStock": -0.0283,
      "bonds_us": 0.0301,
      "bonds_global": 0.031,
      "precious": 0.0369,
      "energy": -0.0331,
      "industrial": -0.0656,
      "agriculture": -0.0516,
      "hedges": 0.0006
    },
    "dataSource": "FRED + Yahoo Finance (Auto)",
    "macroSources": {
      "usd": "Yahoo Finance",
      "vix": "Yahoo Finance",
      "realYield": "FRED:DFII10",
      "fedRate": "FRED:FEDFUNDS",
      "inflation": "FRED:T5YIE",
      "creditSpread": "FRED:BAMLH0A0HYM2",
      "cnPolicy": "Manual Override: -0.5",
      "ratePath": "FRED: DGS2 - FEDFUNDS",
      "vixTermStructure": "Yahoo: ^VIX3M / ^VIX",
      "creditSpreadMomentum": "Calculated: QoQ delta of BAMLH0A0HYM2"
    },
    "returnSources": {
      "cnStock": "Proxy:FXI",
      "hkStock": "ETF:MCHI",
      "usStock": "ETF:SPY",
      "devStock": "ETF:EFA",
      "emStock": "ETF:EEM",
      "bonds_us": "ETF:AGG",
      "bonds_global": "Proxy:BWX",
      "precious": "ETF:GLD",
      "energy": "ETF:XLE",
      "industrial": "ETF:COPX",
      "agriculture": "ETF:DBA",
      "hedges": "ETF:SHV"
    }
  },
  "quarterly_2011_q3": {
    "period": "2011-Q3",
    "description": "连续季度数据 2011-Q3",
    "quality": "A",
    "macroData": {
      "usd": 78.55,
      "vix": 42.96,
      "cnPolicy": -0.8,
      "cnPolicyTrend": 0.0,
      "momentum": -0.8,
      "adoption": 0.3,
      "btcCycle": 0.3,
      "rateChangeReason": 0.0,
      "usdReason": 0.0,
      "vixReason": 0.0,
      "inflationReason": 0.0,
      "globalGrowth": 3.0,
      "growthTrend": 0.0,
      "inflationTrend": 0.0,
      "usdTrend": 0.0,
      "realYield": 0.07,
      "fedRate": 0.07,
      "inflation": 1.48,
      "creditSpread": 8.72,
      "ratePath": 0.18,
      "vixTermStructure": 1.013,
      "creditSpreadMomentum": 3.38
    },
    "actualReturns": {
      "cnStock": -0.2692,
      "hkStock": -0.2883,
      "usStock": -0.1415,
      "devStock": -0.2003,
      "emStock": -0.2535,
      "bonds_us": 0.0329,
      "bonds_global": -0.0173,
      "precious": 0.0708,
      "energy": -0.2046,
      "industrial": -0.3822,
      "agriculture": -0.0721,
      "hedges": -0.0001
    },
    "dataSource": "FRED + Yahoo Finance (Auto)",
    "macroSources": {
      "usd": "Yahoo Finance",
      "vix": "Yahoo Finance",
      "realYield": "FRED:DFII10",
      "fedRate": "FRED:FEDFUNDS",
      "inflation": "FRED:T5YIE",
      "creditSpread": "FRED:BAMLH0A0HYM2",
      "cnPolicy": "Manual Override: -0.8",
      "ratePath": "FRED: DGS2 - FEDFUNDS",
      "vixTermStructure": "Yahoo: ^VIX3M / ^VIX",
      "creditSpreadMomentum": "Calculated: QoQ delta of BAMLH0A0HYM2"
    },
    "returnSources": {
      "cnStock": "Proxy:FXI",
      "hkStock": "ETF:MCHI",
      "usStock": "ETF:SPY",
      "devStock": "ETF:EFA",
      "emStock": "ETF:EEM",
      "bonds_us": "ETF:AGG",
      "bonds_global": "Proxy:BWX",
      "precious": "ETF:GLD",
      "energy": "ETF:XLE",
      "industrial": "ETF:COPX",
      "agriculture": "ETF:DBA",
      "hedges": "ETF:SHV"
    }
  },
  "quarterly_2011_q4": {
    "period": "2011-Q4",
    "description": "连续季度数据 2011-Q4",
    "quality": "A",
    "macroData": {
      "usd": 80.17,
      "vix": 23.4,
      "cnPolicy": 0.0,
      "cnPolicyTrend": 0.0,
      "momentum": 0.8,
      "adoption": 0.3,
      "btcCycle": 0.3,
      "rateChangeReason": 0.0,
      "usdReason": 0.0,
      "vixReason": 0.0,
      "inflationReason": 0.0,
      "globalGrowth": 3.0,
      "growthTrend": 0.0,
      "inflationTrend": 0.0,
      "usdTrend": 0.0,
      "realYield": -0.04,
      "fedRate": 0.08,
      "inflation": 1.66,
      "creditSpread": 7.06,
      "ratePath": 0.19,
      "vixTermStructure": 1.15,
      "creditSpreadMomentum": -1.66
    },
    "actualReturns": {
      "cnStock": 0.1378,
      "hkStock": 0.1381,
      "usStock": 0.1061,
      "devStock": 0.0225,
      "emStock": 0.0597,
      "bonds_us": 0.0135,
      "bonds_global": -0.0108,
      "precious": -0.0169,
      "energy": 0.1541,
      "industrial": 0.1386,
      "agriculture": -0.0565,
      "hedges": -0.0002
    },
    "dataSource": "FRED + Yahoo Finance (Auto)",
    "macroSources": {
      "usd": "Yahoo Finance",
      "vix": "Yahoo Finance",
      "realYield": "FRED:DFII10",
      "fedRate": "FRED:FEDFUNDS",
      "inflation": "FRED:T5YIE",
      "creditSpread": "FRED:BAMLH0A0HYM2",
      "ratePath": "FRED: DGS2 - FEDFUNDS",
      "vixTermStructure": "Yahoo: ^VIX3M / ^VIX",
      "creditSpreadMomentum": "Calculated: QoQ delta of BAMLH0A0HYM2"
    },
    "returnSources": {
      "cnStock": "Proxy:FXI",
      "hkStock": "ETF:MCHI",
      "usStock": "ETF:SPY",
      "devStock": "ETF:EFA",
      "emStock": "ETF:EEM",
      "bonds_us": "ETF:AGG",
      "bonds_global": "Proxy:BWX",
      "precious": "ETF:GLD",
      "energy": "ETF:XLE",
      "industrial": "ETF:COPX",
      "agriculture": "ETF:DBA",
      "hedges": "ETF:SHV"
    }
  },
  "quarterly_2012_q1": {
    "period": "2012-Q1",
    "description": "连续季度数据 2012-Q1",
    "quality": "A",
    "macroData": {
      "usd": 78.93,
      "vix": 15.5,
      "cnPolicy": 0.0,
      "cnPolicyTrend": 0.0,
      "momentum": 0.8,
      "adoption": 0.3,
      "btcCycle": 0.5,
      "rateChangeReason": 0.0,
      "usdReason": 0.0,
      "vixReason": 0.0,
      "inflationReason": 0.0,
      "globalGrowth": 3.0,
      "growthTrend": 0.0,
      "inflationTrend": 0.0,
      "usdTrend": 0.0,
      "realYield": -0.06,
      "fedRate": 0.14,
      "inflation": 2.04,
      "creditSpread": 5.91,
      "ratePath": 0.21,
      "vixTermStructure": 1.187,
      "creditSpreadMomentum": -1.15
    },
    "actualReturns": {
      "cnStock": 0.052,
      "hkStock": 0.1046,
      "usStock": 0.0994,
      "devStock": 0.0787,
      "emStock": 0.1183,
      "bonds_us": 0.0027,
      "bonds_global": 0.0229,
      "precious": 0.0071,
      "energy": 0.0047,
      "industrial": 0.0098,
      "agriculture": -0.0141,
      "hedges": -0.0004
    },
    "dataSource": "FRED + Yahoo Finance (Auto)",
    "macroSources": {
      "usd": "Yahoo Finance",
      "vix": "Yahoo Finance",
      "realYield": "FRED:DFII10",
      "fedRate": "FRED:FEDFUNDS",
      "inflation": "FRED:T5YIE",
      "creditSpread": "FRED:BAMLH0A0HYM2",
      "ratePath": "FRED: DGS2 - FEDFUNDS",
      "vixTermStructure": "Yahoo: ^VIX3M / ^VIX",
      "creditSpreadMomentum": "Calculated: QoQ delta of BAMLH0A0HYM2"
    },
    "returnSources": {
      "cnStock": "Proxy:FXI",
      "hkStock": "ETF:MCHI",
      "usStock": "ETF:SPY",
      "devStock": "ETF:EFA",
      "emStock": "ETF:EEM",
      "bonds_us": "ETF:AGG",
      "bonds_global": "Proxy:BWX",
      "precious": "ETF:GLD",
      "energy": "ETF:XLE",
      "industrial": "ETF:COPX",
      "agriculture": "ETF:DBA",
      "hedges": "ETF:SHV"
    }
  },
  "quarterly_2012_q2": {
    "period": "2012-Q2",
    "description": "连续季度数据 2012-Q2",
    "quality": "A",
    "macroData": {
      "usd": 81.65,
      "vix": 17.08,
      "cnPolicy": 0.0,
      "cnPolicyTrend": 0.0,
      "momentum": 0.0,
      "adoption": 0.3,
      "btcCycle": 0.5,
      "rateChangeReason": 0.0,
      "usdReason": 0.0,
      "vixReason": 0.0,
      "inflationReason": 0.0,
      "globalGrowth": 3.0,
      "growthTrend": 0.0,
      "inflationTrend": 0.0,
      "usdTrend": 0.0,
      "realYield": -0.48,
      "fedRate": 0.16,
      "inflation": 1.77,
      "creditSpread": 6.39,
      "ratePath": 0.12,
      "vixTermStructure": 1.149,
      "creditSpreadMomentum": 0.48
    },
    "actualReturns": {
      "cnStock": -0.0556,
      "hkStock": -0.0487,
      "usStock": -0.0164,
      "devStock": -0.0367,
      "emStock": -0.065,
      "bonds_us": 0.0234,
      "bonds_global": 0.0012,
      "precious": -0.0166,
      "energy": -0.0436,
      "industrial": -0.142,
      "agriculture": 0.0483,
      "hedges": 0.0002
    },
    "dataSource": "FRED + Yahoo Finance (Auto)",
    "macroSources": {
      "usd": "Yahoo Finance",
      "vix": "Yahoo Finance",
      "realYield": "FRED:DFII10",
      "fedRate": "FRED:FEDFUNDS",
      "inflation": "FRED:T5YIE",
      "creditSpread": "FRED:BAMLH0A0HYM2",
      "ratePath": "FRED: DGS2 - FEDFUNDS",
      "vixTermStructure": "Yahoo: ^VIX3M / ^VIX",
      "creditSpreadMomentum": "Calculated: QoQ delta of BAMLH0A0HYM2"
    },
    "returnSources": {
      "cnStock": "Proxy:FXI",
      "hkStock": "ETF:MCHI",
      "usStock": "ETF:SPY",
      "devStock": "ETF:EFA",
      "emStock": "ETF:EEM",
      "bonds_us": "ETF:AGG",
      "bonds_global": "Proxy:BWX",
      "precious": "ETF:GLD",
      "energy": "ETF:XLE",
      "industrial": "ETF:COPX",
      "agriculture": "ETF:DBA",
      "hedges": "ETF:SHV"
    }
  },
  "quarterly_2012_q3": {
    "period": "2012-Q3",
    "description": "连续季度数据 2012-Q3",
    "quality": "A",
    "macroData": {
      "usd": 79.94,
      "vix": 15.73,
      "cnPolicy": 0.0,
      "cnPolicyTrend": 0.0,
      "momentum": 0.8,
      "adoption": 0.3,
      "btcCycle": 0.5,
      "rateChangeReason": 0.0,
      "usdReason": 0.0,
      "vixReason": 0.0,
      "inflationReason": 0.0,
      "globalGrowth": 3.0,
      "growthTrend": 0.0,
      "inflationTrend": 0.0,
      "usdTrend": 0.0,
      "realYield": -0.83,
      "fedRate": 0.16,
      "inflation": 2.18,
      "creditSpread": 5.68,
      "ratePath": 0.11,
      "vixTermStructure": 1.181,
      "creditSpreadMomentum": -0.71
    },
    "actualReturns": {
      "cnStock": 0.0574,
      "hkStock": 0.054,
      "usStock": 0.0844,
      "devStock": 0.0951,
      "emStock": 0.082,
      "bonds_us": 0.0083,
      "bonds_global": 0.0545,
      "precious": 0.123,
      "energy": 0.1149,
      "industrial": 0.1592,
      "agriculture": 0.0045,
      "hedges": 0.0
    },
    "dataSource": "FRED + Yahoo Finance (Auto)",
    "macroSources": {
      "usd": "Yahoo Finance",
      "vix": "Yahoo Finance",
      "realYield": "FRED:DFII10",
      "fedRate": "FRED:FEDFUNDS",
      "inflation": "FRED:T5YIE",
      "creditSpread": "FRED:BAMLH0A0HYM2",
      "ratePath": "FRED: DGS2 - FEDFUNDS",
      "vixTermStructure": "Yahoo: ^VIX3M / ^VIX",
      "creditSpreadMomentum": "Calculated: QoQ delta of BAMLH0A0HYM2"
    },
    "returnSources": {
      "cnStock": "Proxy:FXI",
      "hkStock": "ETF:MCHI",
      "usStock": "ETF:SPY",
      "devStock": "ETF:EFA",
      "emStock": "ETF:EEM",
      "bonds_us": "ETF:AGG",
      "bonds_global": "Proxy:BWX",
      "precious": "ETF:GLD",
      "energy": "ETF:XLE",
      "industrial": "ETF:COPX",
      "agriculture": "ETF:DBA",
      "hedges": "ETF:SHV"
    }
  },
  "quarterly_2012_q4": {
    "period": "2012-Q4",
    "description": "连续季度数据 2012-Q4",
    "quality": "A",
    "macroData": {
      "usd": 79.77,
      "vix": 18.02,
      "cnPolicy": 0.0,
      "cnPolicyTrend": 0.0,
      "momentum": 0.0,
      "adoption": 0.3,
      "btcCycle": 0.5,
      "rateChangeReason": 0.0,
      "usdReason": 0.0,
      "vixReason": 0.0,
      "inflationReason": 0.0,
      "globalGrowth": 3.0,
      "growthTrend": 0.0,
      "inflationTrend": 0.0,
      "usdTrend": 0.0,
      "realYield": -0.54,
      "fedRate": 0.14,
      "inflation": 2.11,
      "creditSpread": 5.06,
      "ratePath": 0.13,
      "vixTermStructure": 1.181,
      "creditSpreadMomentum": -0.62
    },
    "actualReturns": {
      "cnStock": 0.1793,
      "hkStock": 0.1617,
      "usStock": 0.0087,
      "devStock": 0.0731,
      "emStock": 0.0793,
      "bonds_us": 0.0006,
      "bonds_global": -0.0195,
      "precious": -0.0706,
      "energy": 0.008,
      "industrial": 0.0855,
      "agriculture": -0.0512,
      "hedges": 0.0003
    },
    "dataSource": "FRED + Yahoo Finance (Auto)",
    "macroSources": {
      "usd": "Yahoo Finance",
      "vix": "Yahoo Finance",
      "realYield": "FRED:DFII10",
      "fedRate": "FRED:FEDFUNDS",
      "inflation": "FRED:T5YIE",
      "creditSpread": "FRED:BAMLH0A0HYM2",
      "ratePath": "FRED: DGS2 - FEDFUNDS",
      "vixTermStructure": "Yahoo: ^VIX3M / ^VIX",
      "creditSpreadMomentum": "Calculated: QoQ delta of BAMLH0A0HYM2"
    },
    "returnSources": {
      "cnStock": "Proxy:FXI",
      "hkStock": "ETF:MCHI",
      "usStock": "ETF:SPY",
      "devStock": "ETF:EFA",
      "emStock": "ETF:EEM",
      "bonds_us": "ETF:AGG",
      "bonds_global": "Proxy:BWX",
      "precious": "ETF:GLD",
      "energy": "ETF:XLE",
      "industrial": "ETF:COPX",
      "agriculture": "ETF:DBA",
      "hedges": "ETF:SHV"
    }
  },
  "quarterly_2013_q1": {
    "period": "2013-Q1",
    "description": "连续季度数据 2013-Q1",
    "quality": "A",
    "macroData": {
      "usd": 82.99,
      "vix": 12.7,
      "cnPolicy": 0.0,
      "cnPolicyTrend": 0.0,
      "momentum": 0.5,
      "adoption": 0.3,
      "btcCycle": 0.75,
      "rateChangeReason": 0.0,
      "usdReason": 0.0,
      "vixReason": 0.0,
      "inflationReason": 0.0,
      "globalGrowth": 3.0,
      "growthTrend": 0.0,
      "inflationTrend": 0.0,
      "usdTrend": 0.0,
      "realYield": -0.65,
      "fedRate": 0.15,
      "inflation": 2.18,
      "creditSpread": 4.87,
      "ratePath": 0.09,
      "vixTermStructure": 1.105,
      "creditSpreadMomentum": -0.19
    },
    "actualReturns": {
      "cnStock": -0.1437,
      "hkStock": -0.1192,
      "usStock": 0.0648,
      "devStock": 0.0226,
      "emStock": -0.0751,
      "bonds_us": 0.0099,
      "bonds_global": -0.0104,
      "precious": -0.0476,
      "energy": 0.0523,
      "industrial": -0.1918,
      "agriculture": -0.0687,
      "hedges": -0.0001
    },
    "dataSource": "FRED + Yahoo Finance (Auto)",
    "macroSources": {
      "usd": "Yahoo Finance",
      "vix": "Yahoo Finance",
      "realYield": "FRED:DFII10",
      "fedRate": "FRED:FEDFUNDS",
      "inflation": "FRED:T5YIE",
      "creditSpread": "FRED:BAMLH0A0HYM2",
      "ratePath": "FRED: DGS2 - FEDFUNDS",
      "vixTermStructure": "Yahoo: ^VIX3M / ^VIX",
      "creditSpreadMomentum": "Calculated: QoQ delta of BAMLH0A0HYM2"
    },
    "returnSources": {
      "cnStock": "Proxy:FXI",
      "hkStock": "ETF:MCHI",
      "usStock": "ETF:SPY",
      "devStock": "ETF:EFA",
      "emStock": "ETF:EEM",
      "bonds_us": "ETF:AGG",
      "bonds_global": "Proxy:BWX",
      "precious": "ETF:GLD",
      "energy": "ETF:XLE",
      "industrial": "ETF:COPX",
      "agriculture": "ETF:DBA",
      "hedges": "ETF:SHV"
    }
  },
  "quarterly_2013_q2": {
    "period": "2013-Q2",
    "description": "连续季度数据 2013-Q2",
    "quality": "A",
    "macroData": {
      "usd": 83.17,
      "vix": 16.86,
      "cnPolicy": 0.0,
      "cnPolicyTrend": 0.0,
      "momentum": 0.5,
      "adoption": 0.3,
      "btcCycle": 0.75,
      "rateChangeReason": 0.0,
      "usdReason": 0.0,
      "vixReason": 0.0,
      "inflationReason": 0.0,
      "globalGrowth": 3.0,
      "growthTrend": 0.0,
      "inflationTrend": 0.0,
      "usdTrend": 0.0,
      "realYield": 0.48,
      "fedRate": 0.09,
      "inflation": 1.83,
      "creditSpread": 5.15,
      "ratePath": 0.31,
      "vixTermStructure": 1.134,
      "creditSpreadMomentum": 0.28
    },
    "actualReturns": {
      "cnStock": -0.0759,
      "hkStock": -0.0664,
      "usStock": 0.0562,
      "devStock": 0.0041,
      "emStock": -0.0908,
      "bonds_us": -0.043,
      "bonds_global": -0.0589,
      "precious": -0.2272,
      "energy": 0.0394,
      "industrial": -0.2345,
      "agriculture": -0.0431,
      "hedges": 0.0002
    },
    "dataSource": "FRED + Yahoo Finance (Auto)",
    "macroSources": {
      "usd": "Yahoo Finance",
      "vix": "Yahoo Finance",
      "realYield": "FRED:DFII10",
      "fedRate": "FRED:FEDFUNDS",
      "inflation": "FRED:T5YIE",
      "creditSpread": "FRED:BAMLH0A0HYM2",
      "ratePath": "FRED: DGS2 - FEDFUNDS",
      "vixTermStructure": "Yahoo: ^VIX3M / ^VIX",
      "creditSpreadMomentum": "Calculated: QoQ delta of BAMLH0A0HYM2"
    },
    "returnSources": {
      "cnStock": "Proxy:FXI",
      "hkStock": "ETF:MCHI",
      "usStock": "ETF:SPY",
      "devStock": "ETF:EFA",
      "emStock": "ETF:EEM",
      "bonds_us": "ETF:AGG",
      "bonds_global": "Proxy:BWX",
      "precious": "ETF:GLD",
      "energy": "ETF:XLE",
      "industrial": "ETF:COPX",
      "agriculture": "ETF:DBA",
      "hedges": "ETF:SHV"
    }
  },
  "quarterly_2013_q3": {
    "period": "2013-Q3",
    "description": "连续季度数据 2013-Q3",
    "quality": "A",
    "macroData": {
      "usd": 80.22,
      "vix": 16.6,
      "cnPolicy": 0.0,
      "cnPolicyTrend": 0.0,
      "momentum": 0.5,
      "adoption": 0.3,
      "btcCycle": 0.75,
      "rateChangeReason": 0.0,
      "usdReason": 0.0,
      "vixReason": 0.0,
      "inflationReason": 0.0,
      "globalGrowth": 3.0,
      "growthTrend": 0.0,
      "inflationTrend": 0.0,
      "usdTrend": 0.0,
      "realYield": 0.43,
      "fedRate": 0.09,
      "inflation": 1.77,
      "creditSpread": 4.75,
      "ratePath": 0.24,
      "vixTermStructure": 1.028,
      "creditSpreadMomentum": -0.4
    },
    "actualReturns": {
      "cnStock": 0.1852,
      "hkStock": 0.1818,
      "usStock": 0.0411,
      "devStock": 0.1039,
      "emStock": 0.1277,
      "bonds_us": 0.0172,
      "bonds_global": 0.0101,
      "precious": 0.0715,
      "energy": 0.0521,
      "industrial": 0.1235,
      "agriculture": 0.0345,
      "hedges": 0.0
    },
    "dataSource": "FRED + Yahoo Finance (Auto)",
    "macroSources": {
      "usd": "Yahoo Finance",
      "vix": "Yahoo Finance",
      "realYield": "FRED:DFII10",
      "fedRate": "FRED:FEDFUNDS",
      "inflation": "FRED:T5YIE",
      "creditSpread": "FRED:BAMLH0A0HYM2",
      "ratePath": "FRED: DGS2 - FEDFUNDS",
      "vixTermStructure": "Yahoo: ^VIX3M / ^VIX",
      "creditSpreadMomentum": "Calculated: QoQ delta of BAMLH0A0HYM2"
    },
    "returnSources": {
      "cnStock": "Proxy:FXI",
      "hkStock": "ETF:MCHI",
      "usStock": "ETF:SPY",
      "devStock": "ETF:EFA",
      "emStock": "ETF:EEM",
      "bonds_us": "ETF:AGG",
      "bonds_global": "ETF:BNDX",
      "precious": "ETF:GLD",
      "energy": "ETF:XLE",
      "industrial": "ETF:COPX",
      "agriculture": "ETF:DBA",
      "hedges": "ETF:SHV"
    }
  },
  "quarterly_2013_q4": {
    "period": "2013-Q4",
    "description": "连续季度数据 2013-Q4",
    "quality": "A",
    "macroData": {
      "usd": 80.04,
      "vix": 13.72,
      "cnPolicy": 0.0,
      "cnPolicyTrend": 0.0,
      "momentum": 0.8,
      "adoption": 0.3,
      "btcCycle": 0.75,
      "rateChangeReason": 0.0,
      "usdReason": 0.0,
      "vixReason": 0.0,
      "inflationReason": 0.0,
      "globalGrowth": 3.0,
      "growthTrend": 0.0,
      "inflationTrend": 0.0,
      "usdTrend": 0.0,
      "realYield": 0.75,
      "fedRate": 0.07,
      "inflation": 1.69,
      "creditSpread": 3.98,
      "ratePath": 0.34,
      "vixTermStructure": 1.097,
      "creditSpreadMomentum": -0.77
    },
    "actualReturns": {
      "cnStock": 0.0141,
      "hkStock": -0.0147,
      "usStock": 0.0888,
      "devStock": 0.0423,
      "emStock": -0.0386,
      "bonds_us": 0.0008,
      "bonds_global": 0.0027,
      "precious": -0.0572,
      "energy": 0.0429,
      "industrial": -0.0151,
      "agriculture": -0.0408,
      "hedges": 0.0
    },
    "dataSource": "FRED + Yahoo Finance (Auto)",
    "macroSources": {
      "usd": "Yahoo Finance",
      "vix": "Yahoo Finance",
      "realYield": "FRED:DFII10",
      "fedRate": "FRED:FEDFUNDS",
      "inflation": "FRED:T5YIE",
      "creditSpread": "FRED:BAMLH0A0HYM2",
      "ratePath": "FRED: DGS2 - FEDFUNDS",
      "vixTermStructure": "Yahoo: ^VIX3M / ^VIX",
      "creditSpreadMomentum": "Calculated: QoQ delta of BAMLH0A0HYM2"
    },
    "returnSources": {
      "cnStock": "Proxy:FXI",
      "hkStock": "ETF:MCHI",
      "usStock": "ETF:SPY",
      "devStock": "ETF:EFA",
      "emStock": "ETF:EEM",
      "bonds_us": "ETF:AGG",
      "bonds_global": "ETF:BNDX",
      "precious": "ETF:GLD",
      "energy": "ETF:XLE",
      "industrial": "ETF:COPX",
      "agriculture": "ETF:DBA",
      "hedges": "ETF:SHV"
    }
  },
  "quarterly_2014_q1": {
    "period": "2014-Q1",
    "description": "连续季度数据 2014-Q1",
    "quality": "A",
    "macroData": {
      "usd": 80.1,
      "vix": 13.88,
      "cnPolicy": 0.0,
      "cnPolicyTrend": 0.0,
      "momentum": 0.0,
      "adoption": 0.3,
      "btcCycle": 0.4,
      "rateChangeReason": 0.0,
      "usdReason": 0.0,
      "vixReason": 0.0,
      "inflationReason": 0.0,
      "globalGrowth": 3.0,
      "growthTrend": 0.0,
      "inflationTrend": 0.0,
      "usdTrend": 0.0,
      "realYield": 0.66,
      "fedRate": 0.09,
      "inflation": 1.68,
      "creditSpread": 3.64,
      "ratePath": 0.34,
      "vixTermStructure": 1.072,
      "creditSpreadMomentum": -0.34
    },
    "actualReturns": {
      "cnStock": -0.0541,
      "hkStock": -0.0145,
      "usStock": 0.0267,
      "devStock": 0.0222,
      "emStock": 0.0393,
      "bonds_us": 0.016,
      "bonds_global": 0.0214,
      "precious": 0.0508,
      "energy": 0.0408,
      "industrial": 0.0044,
      "agriculture": 0.1515,
      "hedges": 0.0004
    },
    "dataSource": "FRED + Yahoo Finance (Auto)",
    "macroSources": {
      "usd": "Yahoo Finance",
      "vix": "Yahoo Finance",
      "realYield": "FRED:DFII10",
      "fedRate": "FRED:FEDFUNDS",
      "inflation": "FRED:T5YIE",
      "creditSpread": "FRED:BAMLH0A0HYM2",
      "ratePath": "FRED: DGS2 - FEDFUNDS",
      "vixTermStructure": "Yahoo: ^VIX3M / ^VIX",
      "creditSpreadMomentum": "Calculated: QoQ delta of BAMLH0A0HYM2"
    },
    "returnSources": {
      "cnStock": "ETF:ASHR",
      "hkStock": "ETF:MCHI",
      "usStock": "ETF:SPY",
      "devStock": "ETF:EFA",
      "emStock": "ETF:EEM",
      "bonds_us": "ETF:AGG",
      "bonds_global": "ETF:BNDX",
      "precious": "ETF:GLD",
      "energy": "ETF:XLE",
      "industrial": "ETF:COPX",
      "agriculture": "ETF:DBA",
      "hedges": "ETF:SHV"
    }
  },
  "quarterly_2014_q2": {
    "period": "2014-Q2",
    "description": "连续季度数据 2014-Q2",
    "quality": "A",
    "macroData": {
      "usd": 79.78,
      "vix": 11.57,
      "cnPolicy": 0.0,
      "cnPolicyTrend": 0.0,
      "momentum": 0.5,
      "adoption": 0.3,
      "btcCycle": 0.4,
      "rateChangeReason": 0.0,
      "usdReason": 0.0,
      "vixReason": 0.0,
      "inflationReason": 0.0,
      "globalGrowth": 3.0,
      "growthTrend": 0.0,
      "inflationTrend": 0.0,
      "usdTrend": 0.0,
      "realYield": 0.37,
      "fedRate": 0.09,
      "inflation": 2.03,
      "creditSpread": 3.44,
      "ratePath": NaN,
      "vixTermStructure": 1.186,
      "creditSpreadMomentum": -0.2
    },
    "actualReturns": {
      "cnStock": 0.0234,
      "hkStock": 0.0797,
      "usStock": 0.0684,
      "devStock": 0.0529,
      "emStock": 0.0777,
      "bonds_us": 0.0134,
      "bonds_global": 0.0164,
      "precious": 0.0127,
      "energy": 0.1186,
      "industrial": 0.1745,
      "agriculture": -0.0315,
      "hedges": -0.0001
    },
    "dataSource": "FRED + Yahoo Finance (Auto)",
    "macroSources": {
      "usd": "Yahoo Finance",
      "vix": "Yahoo Finance",
      "realYield": "FRED:DFII10",
      "fedRate": "FRED:FEDFUNDS",
      "inflation": "FRED:T5YIE",
      "creditSpread": "FRED:BAMLH0A0HYM2",
      "ratePath": "FRED: DGS2 - FEDFUNDS",
      "vixTermStructure": "Yahoo: ^VIX3M / ^VIX",
      "creditSpreadMomentum": "Calculated: QoQ delta of BAMLH0A0HYM2"
    },
    "returnSources": {
      "cnStock": "ETF:ASHR",
      "hkStock": "ETF:MCHI",
      "usStock": "ETF:SPY",
      "devStock": "ETF:EFA",
      "emStock": "ETF:EEM",
      "bonds_us": "ETF:AGG",
      "bonds_global": "ETF:BNDX",
      "precious": "ETF:GLD",
      "energy": "ETF:XLE",
      "industrial": "ETF:COPX",
      "agriculture": "ETF:DBA",
      "hedges": "ETF:SHV"
    }
  },
  "quarterly_2014_q3": {
    "period": "2014-Q3",
    "description": "连续季度数据 2014-Q3",
    "quality": "A",
    "macroData": {
      "usd": 85.94,
      "vix": 16.31,
      "cnPolicy": 0.0,
      "cnPolicyTrend": 0.0,
      "momentum": 0.0,
      "adoption": 0.3,
      "btcCycle": 0.4,
      "rateChangeReason": 0.0,
      "usdReason": 0.0,
      "vixReason": 0.0,
      "inflationReason": 0.0,
      "globalGrowth": 3.0,
      "growthTrend": 0.0,
      "inflationTrend": 0.0,
      "usdTrend": 0.0,
      "realYield": 0.52,
      "fedRate": 0.09,
      "inflation": 1.56,
      "creditSpread": 4.29,
      "ratePath": 0.48,
      "vixTermStructure": 1.102,
      "creditSpreadMomentum": 0.85
    },
    "actualReturns": {
      "cnStock": 0.1297,
      "hkStock": -0.0144,
      "usStock": -0.0038,
      "devStock": -0.0945,
      "emStock": -0.0652,
      "bonds_us": 0.0117,
      "bonds_global": 0.0224,
      "precious": -0.0987,
      "energy": -0.1172,
      "industrial": -0.2052,
      "agriculture": -0.0603,
      "hedges": -0.0002
    },
    "dataSource": "FRED + Yahoo Finance (Auto)",
    "macroSources": {
      "usd": "Yahoo Finance",
      "vix": "Yahoo Finance",
      "realYield": "FRED:DFII10",
      "fedRate": "FRED:FEDFUNDS",
      "inflation": "FRED:T5YIE",
      "creditSpread": "FRED:BAMLH0A0HYM2",
      "ratePath": "FRED: DGS2 - FEDFUNDS",
      "vixTermStructure": "Yahoo: ^VIX3M / ^VIX",
      "creditSpreadMomentum": "Calculated: QoQ delta of BAMLH0A0HYM2"
    },
    "returnSources": {
      "cnStock": "ETF:ASHR",
      "hkStock": "ETF:MCHI",
      "usStock": "ETF:SPY",
      "devStock": "ETF:EFA",
      "emStock": "ETF:EEM",
      "bonds_us": "ETF:AGG",
      "bonds_global": "ETF:BNDX",
      "precious": "ETF:GLD",
      "energy": "ETF:XLE",
      "industrial": "ETF:COPX",
      "agriculture": "ETF:DBA",
      "hedges": "ETF:SHV"
    }
  },
  "quarterly_2014_q4": {
    "period": "2014-Q4",
    "description": "连续季度数据 2014-Q4",
    "quality": "A",
    "macroData": {
      "usd": 90.27,
      "vix": 19.2,
      "cnPolicy": 0.6,
      "cnPolicyTrend": 0.0,
      "momentum": 0.5,
      "adoption": 0.3,
      "btcCycle": 0.4,
      "rateChangeReason": 0.0,
      "usdReason": 0.0,
      "vixReason": 0.0,
      "inflationReason": 0.0,
      "globalGrowth": 3.0,
      "growthTrend": 0.0,
      "inflationTrend": 0.0,
      "usdTrend": 0.0,
      "realYield": 0.41,
      "fedRate": 0.11,
      "inflation": 1.3,
      "creditSpread": 5.08,
      "ratePath": 0.57,
      "vixTermStructure": 1.044,
      "creditSpreadMomentum": 0.79
    },
    "actualReturns": {
      "cnStock": 0.4466,
      "hkStock": 0.0545,
      "usStock": 0.0333,
      "devStock": -0.0531,
      "emStock": -0.0763,
      "bonds_us": 0.0194,
      "bonds_global": 0.0271,
      "precious": -0.002,
      "energy": -0.1309,
      "industrial": -0.1516,
      "agriculture": -0.0567,
      "crypto": -0.1685,
      "hedges": -0.0003
    },
    "dataSource": "FRED + Yahoo Finance (Auto)",
    "macroSources": {
      "usd": "Yahoo Finance",
      "vix": "Yahoo Finance",
      "realYield": "FRED:DFII10",
      "fedRate": "FRED:FEDFUNDS",
      "inflation": "FRED:T5YIE",
      "creditSpread": "FRED:BAMLH0A0HYM2",
      "cnPolicy": "Manual Override: 0.6",
      "ratePath": "FRED: DGS2 - FEDFUNDS",
      "vixTermStructure": "Yahoo: ^VIX3M / ^VIX",
      "creditSpreadMomentum": "Calculated: QoQ delta of BAMLH0A0HYM2"
    },
    "returnSources": {
      "cnStock": "ETF:ASHR",
      "hkStock": "ETF:MCHI",
      "usStock": "ETF:SPY",
      "devStock": "ETF:EFA",
      "emStock": "ETF:EEM",
      "bonds_us": "ETF:AGG",
      "bonds_global": "ETF:BNDX",
      "precious": "ETF:GLD",
      "energy": "ETF:XLE",
      "industrial": "ETF:COPX",
      "agriculture": "ETF:DBA",
      "crypto": "ETF:BTC-USD",
      "hedges": "ETF:SHV"
    }
  },
  "quarterly_2015_q1": {
    "period": "2015-Q1",
    "description": "连续季度数据 2015-Q1",
    "quality": "A",
    "macroData": {
      "usd": 98.36,
      "vix": 15.29,
      "cnPolicy": 0.8,
      "cnPolicyTrend": 0.0,
      "momentum": 0.5,
      "adoption": 0.3,
      "btcCycle": 0.3,
      "rateChangeReason": 0.0,
      "usdReason": 0.0,
      "vixReason": 0.0,
      "inflationReason": 0.0,
      "globalGrowth": 3.0,
      "growthTrend": 0.0,
      "inflationTrend": 0.0,
      "usdTrend": 0.0,
      "realYield": 0.02,
      "fedRate": 0.12,
      "inflation": 1.58,
      "creditSpread": 4.82,
      "ratePath": 0.37,
      "vixTermStructure": 1.174,
      "creditSpreadMomentum": -0.26
    },
    "actualReturns": {
      "cnStock": 0.1261,
      "hkStock": 0.1279,
      "usStock": 0.0377,
      "devStock": 0.1147,
      "emStock": 0.0876,
      "bonds_us": 0.0095,
      "bonds_china": -0.0027,
      "bonds_global": 0.0129,
      "precious": -0.0157,
      "energy": 0.0416,
      "industrial": -0.046,
      "agriculture": -0.0944,
      "crypto": -0.0894,
      "hedges": 0.0002
    },
    "dataSource": "FRED + Yahoo Finance (Auto)",
    "macroSources": {
      "usd": "Yahoo Finance",
      "vix": "Yahoo Finance",
      "realYield": "FRED:DFII10",
      "fedRate": "FRED:FEDFUNDS",
      "inflation": "FRED:T5YIE",
      "creditSpread": "FRED:BAMLH0A0HYM2",
      "cnPolicy": "Manual Override: 0.8",
      "ratePath": "FRED: DGS2 - FEDFUNDS",
      "vixTermStructure": "Yahoo: ^VIX3M / ^VIX",
      "creditSpreadMomentum": "Calculated: QoQ delta of BAMLH0A0HYM2"
    },
    "returnSources": {
      "cnStock": "ETF:ASHR",
      "hkStock": "ETF:MCHI",
      "usStock": "ETF:SPY",
      "devStock": "ETF:EFA",
      "emStock": "ETF:EEM",
      "bonds_us": "ETF:AGG",
      "bonds_china": "ETF:CBON",
      "bonds_global": "ETF:BNDX",
      "precious": "ETF:GLD",
      "energy": "ETF:XLE",
      "industrial": "ETF:COPX",
      "agriculture": "ETF:DBA",
      "crypto": "ETF:BTC-USD",
      "hedges": "ETF:SHV"
    }
  },
  "quarterly_2015_q2": {
    "period": "2015-Q2",
    "description": "连续季度数据 2015-Q2",
    "quality": "A",
    "macroData": {
      "usd": 95.49,
      "vix": 18.23,
      "cnPolicy": 0.8,
      "cnPolicyTrend": 0.0,
      "momentum": 0.0,
      "adoption": 0.3,
      "btcCycle": 0.3,
      "rateChangeReason": 0.0,
      "usdReason": 0.0,
      "vixReason": 0.0,
      "inflationReason": 0.0,
      "globalGrowth": 3.0,
      "growthTrend": 0.0,
      "inflationTrend": 0.0,
      "usdTrend": 0.0,
      "realYield": 0.49,
      "fedRate": 0.13,
      "inflation": 1.62,
      "creditSpread": 4.91,
      "ratePath": NaN,
      "vixTermStructure": 1.053,
      "creditSpreadMomentum": 0.09
    },
    "actualReturns": {
      "cnStock": -0.0239,
      "hkStock": -0.0083,
      "usStock": 0.0024,
      "devStock": -0.012,
      "emStock": -0.0406,
      "bonds_us": -0.0219,
      "bonds_china": 0.0316,
      "bonds_global": -0.034,
      "precious": -0.0422,
      "energy": -0.0518,
      "industrial": -0.0272,
      "agriculture": 0.0256,
      "crypto": 0.0643,
      "hedges": 0.0002
    },
    "dataSource": "FRED + Yahoo Finance (Auto)",
    "macroSources": {
      "usd": "Yahoo Finance",
      "vix": "Yahoo Finance",
      "realYield": "FRED:DFII10",
      "fedRate": "FRED:FEDFUNDS",
      "inflation": "FRED:T5YIE",
      "creditSpread": "FRED:BAMLH0A0HYM2",
      "cnPolicy": "Manual Override: 0.8",
      "ratePath": "FRED: DGS2 - FEDFUNDS",
      "vixTermStructure": "Yahoo: ^VIX3M / ^VIX",
      "creditSpreadMomentum": "Calculated: QoQ delta of BAMLH0A0HYM2"
    },
    "returnSources": {
      "cnStock": "ETF:ASHR",
      "hkStock": "ETF:MCHI",
      "usStock": "ETF:SPY",
      "devStock": "ETF:EFA",
      "emStock": "ETF:EEM",
      "bonds_us": "ETF:AGG",
      "bonds_china": "ETF:CBON",
      "bonds_global": "ETF:BNDX",
      "precious": "ETF:GLD",
      "energy": "ETF:XLE",
      "industrial": "ETF:COPX",
      "agriculture": "ETF:DBA",
      "crypto": "ETF:BTC-USD",
      "hedges": "ETF:SHV"
    }
  },
  "quarterly_2015_q3": {
    "period": "2015-Q3",
    "description": "连续季度数据 2015-Q3",
    "quality": "A",
    "macroData": {
      "usd": 96.35,
      "vix": 24.5,
      "cnPolicy": -0.5,
      "cnPolicyTrend": 0.0,
      "momentum": -0.5,
      "adoption": 0.3,
      "btcCycle": 0.3,
      "rateChangeReason": 0.0,
      "usdReason": 0.0,
      "vixReason": 0.0,
      "inflationReason": 0.0,
      "globalGrowth": 3.0,
      "growthTrend": 0.0,
      "inflationTrend": 0.0,
      "usdTrend": 0.0,
      "realYield": 0.51,
      "fedRate": 0.12,
      "inflation": 1.15,
      "creditSpread": 6.83,
      "ratePath": 0.49,
      "vixTermStructure": 1.092,
      "creditSpreadMomentum": 1.92
    },
    "actualReturns": {
      "cnStock": -0.1812,
      "hkStock": -0.1211,
      "usStock": -0.0349,
      "devStock": -0.0487,
      "emStock": -0.106,
      "bonds_us": 0.011,
      "bonds_china": -0.0111,
      "bonds_global": 0.02,
      "precious": -0.0294,
      "energy": -0.099,
      "industrial": -0.2736,
      "agriculture": -0.094,
      "crypto": -0.1065,
      "hedges": 0.0003
    },
    "dataSource": "FRED + Yahoo Finance (Auto)",
    "macroSources": {
      "usd": "Yahoo Finance",
      "vix": "Yahoo Finance",
      "realYield": "FRED:DFII10",
      "fedRate": "FRED:FEDFUNDS",
      "inflation": "FRED:T5YIE",
      "creditSpread": "FRED:BAMLH0A0HYM2",
      "cnPolicy": "Manual Override: -0.5",
      "ratePath": "FRED: DGS2 - FEDFUNDS",
      "vixTermStructure": "Yahoo: ^VIX3M / ^VIX",
      "creditSpreadMomentum": "Calculated: QoQ delta of BAMLH0A0HYM2"
    },
    "returnSources": {
      "cnStock": "ETF:ASHR",
      "hkStock": "ETF:MCHI",
      "usStock": "ETF:SPY",
      "devStock": "ETF:EFA",
      "emStock": "ETF:EEM",
      "bonds_us": "ETF:AGG",
      "bonds_china": "ETF:CBON",
      "bonds_global": "ETF:BNDX",
      "precious": "ETF:GLD",
      "energy": "ETF:XLE",
      "industrial": "ETF:COPX",
      "agriculture": "ETF:DBA",
      "crypto": "ETF:BTC-USD",
      "hedges": "ETF:SHV"
    }
  },
  "quarterly_2015_q4": {
    "period": "2015-Q4",
    "description": "连续季度数据 2015-Q4",
    "quality": "A",
    "macroData": {
      "usd": 98.63,
      "vix": 18.21,
      "cnPolicy": 0.0,
      "cnPolicyTrend": 0.0,
      "momentum": 0.0,
      "adoption": 0.3,
      "btcCycle": 0.3,
      "rateChangeReason": 0.0,
      "usdReason": 0.0,
      "vixReason": 0.0,
      "inflationReason": 0.0,
      "globalGrowth": 3.0,
      "growthTrend": 0.0,
      "inflationTrend": 0.0,
      "usdTrend": 0.0,
      "realYield": 0.73,
      "fedRate": 0.34,
      "inflation": 1.31,
      "creditSpread": 6.95,
      "ratePath": 0.7,
      "vixTermStructure": 1.061,
      "creditSpreadMomentum": 0.12
    },
    "actualReturns": {
      "cnStock": 0.0066,
      "hkStock": -0.0481,
      "usStock": 0.0241,
      "devStock": -0.0247,
      "emStock": -0.0765,
      "bonds_us": -0.0075,
      "bonds_china": -0.0158,
      "bonds_global": 0.0065,
      "precious": -0.0608,
      "energy": -0.0916,
      "industrial": -0.2164,
      "agriculture": -0.0474,
      "crypto": 0.7555,
      "hedges": -0.0006
    },
    "dataSource": "FRED + Yahoo Finance (Auto)",
    "macroSources": {
      "usd": "Yahoo Finance",
      "vix": "Yahoo Finance",
      "realYield": "FRED:DFII10",
      "fedRate": "FRED:FEDFUNDS",
      "inflation": "FRED:T5YIE",
      "creditSpread": "FRED:BAMLH0A0HYM2",
      "ratePath": "FRED: DGS2 - FEDFUNDS",
      "vixTermStructure": "Yahoo: ^VIX3M / ^VIX",
      "creditSpreadMomentum": "Calculated: QoQ delta of BAMLH0A0HYM2"
    },
    "returnSources": {
      "cnStock": "ETF:ASHR",
      "hkStock": "ETF:MCHI",
      "usStock": "ETF:SPY",
      "devStock": "ETF:EFA",
      "emStock": "ETF:EEM",
      "bonds_us": "ETF:AGG",
      "bonds_china": "ETF:CBON",
      "bonds_global": "ETF:BNDX",
      "precious": "ETF:GLD",
      "energy": "ETF:XLE",
      "industrial": "ETF:COPX",
      "agriculture": "ETF:DBA",
      "crypto": "ETF:BTC-USD",
      "hedges": "ETF:SHV"
    }
  },
  "quarterly_2016_q1": {
    "period": "2016-Q1",
    "description": "连续季度数据 2016-Q1",
    "quality": "A",
    "macroData": {
      "usd": 94.59,
      "vix": 13.95,
      "cnPolicy": 0.0,
      "cnPolicyTrend": 0.0,
      "momentum": 0.5,
      "adoption": 0.3,
      "btcCycle": 0.5,
      "rateChangeReason": 0.0,
      "usdReason": 0.0,
      "vixReason": 0.0,
      "inflationReason": 0.0,
      "globalGrowth": 3.0,
      "growthTrend": 0.0,
      "inflationTrend": 0.0,
      "usdTrend": 0.0,
      "realYield": 0.17,
      "fedRate": 0.37,
      "inflation": 1.49,
      "creditSpread": 7.05,
      "ratePath": 0.35,
      "vixTermStructure": 1.192,
      "creditSpreadMomentum": 0.1
    },
    "actualReturns": {
      "cnStock": -0.0404,
      "hkStock": -0.031,
      "usStock": 0.0323,
      "devStock": -0.0257,
      "emStock": 0.0747,
      "bonds_us": 0.0278,
      "bonds_china": 0.0252,
      "bonds_global": 0.0297,
      "precious": 0.1241,
      "energy": 0.0417,
      "industrial": 0.2262,
      "agriculture": 0.001,
      "crypto": -0.0118,
      "hedges": 0.0018
    },
    "dataSource": "FRED + Yahoo Finance (Auto)",
    "macroSources": {
      "usd": "Yahoo Finance",
      "vix": "Yahoo Finance",
      "realYield": "FRED:DFII10",
      "fedRate": "FRED:FEDFUNDS",
      "inflation": "FRED:T5YIE",
      "creditSpread": "FRED:BAMLH0A0HYM2",
      "ratePath": "FRED: DGS2 - FEDFUNDS",
      "vixTermStructure": "Yahoo: ^VIX3M / ^VIX",
      "creditSpreadMomentum": "Calculated: QoQ delta of BAMLH0A0HYM2"
    },
    "returnSources": {
      "cnStock": "ETF:ASHR",
      "hkStock": "ETF:MCHI",
      "usStock": "ETF:SPY",
      "devStock": "ETF:EFA",
      "emStock": "ETF:EEM",
      "bonds_us": "ETF:AGG",
      "bonds_china": "ETF:CBON",
      "bonds_global": "ETF:BNDX",
      "precious": "ETF:GLD",
      "energy": "ETF:XLE",
      "industrial": "ETF:COPX",
      "agriculture": "ETF:DBA",
      "crypto": "ETF:BTC-USD",
      "hedges": "ETF:SHV"
    }
  },
  "quarterly_2016_q2": {
    "period": "2016-Q2",
    "description": "连续季度数据 2016-Q2",
    "quality": "A",
    "macroData": {
      "usd": 96.14,
      "vix": 15.63,
      "cnPolicy": 0.0,
      "cnPolicyTrend": 0.0,
      "momentum": 0.0,
      "adoption": 0.3,
      "btcCycle": 0.5,
      "rateChangeReason": 0.0,
      "usdReason": 0.0,
      "vixReason": 0.0,
      "inflationReason": 0.0,
      "globalGrowth": 3.0,
      "growthTrend": 0.0,
      "inflationTrend": 0.0,
      "usdTrend": 0.0,
      "realYield": 0.03,
      "fedRate": 0.39,
      "inflation": 1.43,
      "creditSpread": 6.12,
      "ratePath": 0.17,
      "vixTermStructure": 1.171,
      "creditSpreadMomentum": -0.93
    },
    "actualReturns": {
      "cnStock": -0.046,
      "hkStock": 0.0059,
      "usStock": 0.0149,
      "devStock": -0.0063,
      "emStock": 0.022,
      "bonds_us": 0.0257,
      "bonds_china": -0.0244,
      "bonds_global": 0.0299,
      "precious": 0.1071,
      "energy": 0.1002,
      "industrial": 0.1596,
      "agriculture": 0.0823,
      "crypto": 0.5839,
      "hedges": 0.0012
    },
    "dataSource": "FRED + Yahoo Finance (Auto)",
    "macroSources": {
      "usd": "Yahoo Finance",
      "vix": "Yahoo Finance",
      "realYield": "FRED:DFII10",
      "fedRate": "FRED:FEDFUNDS",
      "inflation": "FRED:T5YIE",
      "creditSpread": "FRED:BAMLH0A0HYM2",
      "ratePath": "FRED: DGS2 - FEDFUNDS",
      "vixTermStructure": "Yahoo: ^VIX3M / ^VIX",
      "creditSpreadMomentum": "Calculated: QoQ delta of BAMLH0A0HYM2"
    },
    "returnSources": {
      "cnStock": "ETF:ASHR",
      "hkStock": "ETF:MCHI",
      "usStock": "ETF:SPY",
      "devStock": "ETF:EFA",
      "emStock": "ETF:EEM",
      "bonds_us": "ETF:AGG",
      "bonds_china": "ETF:CBON",
      "bonds_global": "ETF:BNDX",
      "precious": "ETF:GLD",
      "energy": "ETF:XLE",
      "industrial": "ETF:COPX",
      "agriculture": "ETF:DBA",
      "crypto": "ETF:BTC-USD",
      "hedges": "ETF:SHV"
    }
  },
  "quarterly_2016_q3": {
    "period": "2016-Q3",
    "description": "连续季度数据 2016-Q3",
    "quality": "A",
    "macroData": {
      "usd": 95.46,
      "vix": 13.29,
      "cnPolicy": 0.0,
      "cnPolicyTrend": 0.0,
      "momentum": 0.5,
      "adoption": 0.3,
      "btcCycle": 0.5,
      "rateChangeReason": 0.0,
      "usdReason": 0.0,
      "vixReason": 0.0,
      "inflationReason": 0.0,
      "globalGrowth": 3.0,
      "growthTrend": 0.0,
      "inflationTrend": 0.0,
      "usdTrend": 0.0,
      "realYield": 0.0,
      "fedRate": 0.4,
      "inflation": 1.47,
      "creditSpread": 4.93,
      "ratePath": 0.45,
      "vixTermStructure": 1.249,
      "creditSpreadMomentum": -1.19
    },
    "actualReturns": {
      "cnStock": 0.0178,
      "hkStock": 0.1838,
      "usStock": 0.0337,
      "devStock": 0.0835,
      "emStock": 0.1172,
      "bonds_us": -0.0087,
      "bonds_china": 0.0145,
      "bonds_global": -0.0044,
      "precious": -0.0726,
      "energy": 0.0567,
      "industrial": 0.0655,
      "agriculture": -0.0658,
      "crypto": -0.0957,
      "hedges": 0.0008
    },
    "dataSource": "FRED + Yahoo Finance (Auto)",
    "macroSources": {
      "usd": "Yahoo Finance",
      "vix": "Yahoo Finance",
      "realYield": "FRED:DFII10",
      "fedRate": "FRED:FEDFUNDS",
      "inflation": "FRED:T5YIE",
      "creditSpread": "FRED:BAMLH0A0HYM2",
      "ratePath": "FRED: DGS2 - FEDFUNDS",
      "vixTermStructure": "Yahoo: ^VIX3M / ^VIX",
      "creditSpreadMomentum": "Calculated: QoQ delta of BAMLH0A0HYM2"
    },
    "returnSources": {
      "cnStock": "ETF:ASHR",
      "hkStock": "ETF:MCHI",
      "usStock": "ETF:SPY",
      "devStock": "ETF:EFA",
      "emStock": "ETF:EEM",
      "bonds_us": "ETF:AGG",
      "bonds_china": "ETF:CBON",
      "bonds_global": "ETF:BNDX",
      "precious": "ETF:GLD",
      "energy": "ETF:XLE",
      "industrial": "ETF:COPX",
      "agriculture": "ETF:DBA",
      "crypto": "ETF:BTC-USD",
      "hedges": "ETF:SHV"
    }
  },
  "quarterly_2016_q4": {
    "period": "2016-Q4",
    "description": "连续季度数据 2016-Q4",
    "quality": "A",
    "macroData": {
      "usd": 102.39,
      "vix": 14.04,
      "cnPolicy": 0.0,
      "cnPolicyTrend": 0.0,
      "momentum": 0.5,
      "adoption": 0.3,
      "btcCycle": 0.5,
      "rateChangeReason": 0.0,
      "usdReason": 0.0,
      "vixReason": 0.0,
      "inflationReason": 0.0,
      "globalGrowth": 3.0,
      "growthTrend": 0.0,
      "inflationTrend": 0.0,
      "usdTrend": 0.0,
      "realYield": 0.47,
      "fedRate": 0.65,
      "inflation": 1.86,
      "creditSpread": 4.13,
      "ratePath": 0.52,
      "vixTermStructure": 1.26,
      "creditSpreadMomentum": -0.8
    },
    "actualReturns": {
      "cnStock": 0.0109,
      "hkStock": -0.0685,
      "usStock": 0.0554,
      "devStock": 0.0167,
      "emStock": -0.0359,
      "bonds_us": -0.0201,
      "bonds_china": -0.0264,
      "bonds_global": -0.018,
      "precious": -0.0592,
      "energy": 0.0732,
      "industrial": 0.3414,
      "agriculture": 0.019,
      "crypto": 0.6531,
      "hedges": 0.001
    },
    "dataSource": "FRED + Yahoo Finance (Auto)",
    "macroSources": {
      "usd": "Yahoo Finance",
      "vix": "Yahoo Finance",
      "realYield": "FRED:DFII10",
      "fedRate": "FRED:FEDFUNDS",
      "inflation": "FRED:T5YIE",
      "creditSpread": "FRED:BAMLH0A0HYM2",
      "ratePath": "FRED: DGS2 - FEDFUNDS",
      "vixTermStructure": "Yahoo: ^VIX3M / ^VIX",
      "creditSpreadMomentum": "Calculated: QoQ delta of BAMLH0A0HYM2"
    },
    "returnSources": {
      "cnStock": "ETF:ASHR",
      "hkStock": "ETF:MCHI",
      "usStock": "ETF:SPY",
      "devStock": "ETF:EFA",
      "emStock": "ETF:EEM",
      "bonds_us": "ETF:AGG",
      "bonds_china": "ETF:CBON",
      "bonds_global": "ETF:BNDX",
      "precious": "ETF:GLD",
      "energy": "ETF:XLE",
      "industrial": "ETF:COPX",
      "agriculture": "ETF:DBA",
      "crypto": "ETF:BTC-USD",
      "hedges": "ETF:SHV"
    }
  },
  "quarterly_2017_q1": {
    "period": "2017-Q1",
    "description": "连续季度数据 2017-Q1",
    "quality": "A",
    "macroData": {
      "usd": 100.35,
      "vix": 12.37,
      "cnPolicy": 0.0,
      "cnPolicyTrend": 0.0,
      "momentum": 0.5,
      "adoption": 0.5,
      "btcCycle": 0.75,
      "rateChangeReason": 0.0,
      "usdReason": 0.0,
      "vixReason": 0.0,
      "inflationReason": 0.0,
      "globalGrowth": 3.0,
      "growthTrend": 0.0,
      "inflationTrend": 0.0,
      "usdTrend": 0.0,
      "realYield": 0.39,
      "fedRate": 0.9,
      "inflation": 1.73,
      "creditSpread": 3.98,
      "ratePath": 0.34,
      "vixTermStructure": 1.095,
      "creditSpreadMomentum": -0.15
    },
    "actualReturns": {
      "cnStock": 0.0515,
      "hkStock": 0.1116,
      "usStock": 0.0378,
      "devStock": 0.0474,
      "emStock": 0.0993,
      "bonds_us": 0.0098,
      "bonds_china": -0.016,
      "bonds_global": 0.0087,
      "precious": 0.0704,
      "energy": -0.0712,
      "industrial": 0.0758,
      "agriculture": -0.0393,
      "crypto": 0.2467,
      "hedges": 0.0002
    },
    "dataSource": "FRED + Yahoo Finance (Auto)",
    "macroSources": {
      "usd": "Yahoo Finance",
      "vix": "Yahoo Finance",
      "realYield": "FRED:DFII10",
      "fedRate": "FRED:FEDFUNDS",
      "inflation": "FRED:T5YIE",
      "creditSpread": "FRED:BAMLH0A0HYM2",
      "ratePath": "FRED: DGS2 - FEDFUNDS",
      "vixTermStructure": "Yahoo: ^VIX3M / ^VIX",
      "creditSpreadMomentum": "Calculated: QoQ delta of BAMLH0A0HYM2"
    },
    "returnSources": {
      "cnStock": "ETF:ASHR",
      "hkStock": "ETF:MCHI",
      "usStock": "ETF:SPY",
      "devStock": "ETF:EFA",
      "emStock": "ETF:EEM",
      "bonds_us": "ETF:AGG",
      "bonds_china": "ETF:CBON",
      "bonds_global": "ETF:BNDX",
      "precious": "ETF:GLD",
      "energy": "ETF:XLE",
      "industrial": "ETF:COPX",
      "agriculture": "ETF:DBA",
      "crypto": "ETF:BTC-USD",
      "hedges": "ETF:SHV"
    }
  },
  "quarterly_2017_q2": {
    "period": "2017-Q2",
    "description": "连续季度数据 2017-Q2",
    "quality": "A",
    "macroData": {
      "usd": 95.66,
      "vix": 11.18,
      "cnPolicy": 0.0,
      "cnPolicyTrend": 0.0,
      "momentum": 0.5,
      "adoption": 0.5,
      "btcCycle": 0.75,
      "rateChangeReason": 0.0,
      "usdReason": 0.0,
      "vixReason": 0.0,
      "inflationReason": 0.0,
      "globalGrowth": 3.0,
      "growthTrend": 0.0,
      "inflationTrend": 0.0,
      "usdTrend": 0.0,
      "realYield": 0.6,
      "fedRate": 1.15,
      "inflation": 1.66,
      "creditSpread": 3.72,
      "ratePath": 0.26,
      "vixTermStructure": 1.202,
      "creditSpreadMomentum": -0.26
    },
    "actualReturns": {
      "cnStock": 0.0672,
      "hkStock": 0.0943,
      "usStock": 0.0362,
      "devStock": 0.0697,
      "emStock": 0.0584,
      "bonds_us": 0.0107,
      "bonds_china": 0.0194,
      "bonds_global": 0.0011,
      "precious": -0.0223,
      "energy": -0.0758,
      "industrial": -0.0782,
      "agriculture": 0.0312,
      "crypto": 1.2001,
      "hedges": 0.0015
    },
    "dataSource": "FRED + Yahoo Finance (Auto)",
    "macroSources": {
      "usd": "Yahoo Finance",
      "vix": "Yahoo Finance",
      "realYield": "FRED:DFII10",
      "fedRate": "FRED:FEDFUNDS",
      "inflation": "FRED:T5YIE",
      "creditSpread": "FRED:BAMLH0A0HYM2",
      "ratePath": "FRED: DGS2 - FEDFUNDS",
      "vixTermStructure": "Yahoo: ^VIX3M / ^VIX",
      "creditSpreadMomentum": "Calculated: QoQ delta of BAMLH0A0HYM2"
    },
    "returnSources": {
      "cnStock": "ETF:ASHR",
      "hkStock": "ETF:MCHI",
      "usStock": "ETF:SPY",
      "devStock": "ETF:EFA",
      "emStock": "ETF:EEM",
      "bonds_us": "ETF:AGG",
      "bonds_china": "ETF:CBON",
      "bonds_global": "ETF:BNDX",
      "precious": "ETF:GLD",
      "energy": "ETF:XLE",
      "industrial": "ETF:COPX",
      "agriculture": "ETF:DBA",
      "crypto": "ETF:BTC-USD",
      "hedges": "ETF:SHV"
    }
  },
  "quarterly_2017_q3": {
    "period": "2017-Q3",
    "description": "连续季度数据 2017-Q3",
    "quality": "A",
    "macroData": {
      "usd": 93.08,
      "vix": 9.51,
      "cnPolicy": 0.0,
      "cnPolicyTrend": 0.0,
      "momentum": 0.5,
      "adoption": 0.5,
      "btcCycle": 0.75,
      "rateChangeReason": 0.0,
      "usdReason": 0.0,
      "vixReason": 0.0,
      "inflationReason": 0.0,
      "globalGrowth": 3.0,
      "growthTrend": 0.0,
      "inflationTrend": 0.0,
      "usdTrend": 0.0,
      "realYield": 0.49,
      "fedRate": 1.15,
      "inflation": 1.68,
      "creditSpread": 3.55,
      "ratePath": 0.34,
      "vixTermStructure": 1.325,
      "creditSpreadMomentum": -0.17
    },
    "actualReturns": {
      "cnStock": 0.1107,
      "hkStock": 0.212,
      "usStock": 0.0639,
      "devStock": 0.0563,
      "emStock": 0.1172,
      "bonds_us": 0.0109,
      "bonds_china": 0.0261,
      "bonds_global": 0.0103,
      "precious": 0.0348,
      "energy": 0.0849,
      "industrial": 0.2492,
      "agriculture": -0.0503,
      "crypto": 0.6593,
      "hedges": 0.0021
    },
    "dataSource": "FRED + Yahoo Finance (Auto)",
    "macroSources": {
      "usd": "Yahoo Finance",
      "vix": "Yahoo Finance",
      "realYield": "FRED:DFII10",
      "fedRate": "FRED:FEDFUNDS",
      "inflation": "FRED:T5YIE",
      "creditSpread": "FRED:BAMLH0A0HYM2",
      "ratePath": "FRED: DGS2 - FEDFUNDS",
      "vixTermStructure": "Yahoo: ^VIX3M / ^VIX",
      "creditSpreadMomentum": "Calculated: QoQ delta of BAMLH0A0HYM2"
    },
    "returnSources": {
      "cnStock": "ETF:ASHR",
      "hkStock": "ETF:MCHI",
      "usStock": "ETF:SPY",
      "devStock": "ETF:EFA",
      "emStock": "ETF:EEM",
      "bonds_us": "ETF:AGG",
      "bonds_china": "ETF:CBON",
      "bonds_global": "ETF:BNDX",
      "precious": "ETF:GLD",
      "energy": "ETF:XLE",
      "industrial": "ETF:COPX",
      "agriculture": "ETF:DBA",
      "crypto": "ETF:BTC-USD",
      "hedges": "ETF:SHV"
    }
  },
  "quarterly_2017_q4": {
    "period": "2017-Q4",
    "description": "连续季度数据 2017-Q4",
    "quality": "A",
    "macroData": {
      "usd": 92.12,
      "vix": 11.04,
      "cnPolicy": 0.0,
      "cnPolicyTrend": 0.0,
      "momentum": 0.8,
      "adoption": 0.5,
      "btcCycle": 0.75,
      "rateChangeReason": 0.0,
      "usdReason": 0.0,
      "vixReason": 0.0,
      "inflationReason": 0.0,
      "globalGrowth": 3.0,
      "growthTrend": 0.0,
      "inflationTrend": 0.0,
      "usdTrend": 0.0,
      "realYield": 0.46,
      "fedRate": 1.41,
      "inflation": 1.87,
      "creditSpread": 3.48,
      "ratePath": 0.55,
      "vixTermStructure": 1.308,
      "creditSpreadMomentum": -0.07
    },
    "actualReturns": {
      "cnStock": 0.0824,
      "hkStock": 0.0951,
      "usStock": 0.0804,
      "devStock": 0.0685,
      "emStock": 0.093,
      "bonds_us": 0.0023,
      "bonds_china": 0.0202,
      "bonds_global": 0.0104,
      "precious": 0.035,
      "energy": 0.1087,
      "industrial": 0.0948,
      "agriculture": -0.0136,
      "crypto": 2.9877,
      "hedges": 0.002
    },
    "dataSource": "FRED + Yahoo Finance (Auto)",
    "macroSources": {
      "usd": "Yahoo Finance",
      "vix": "Yahoo Finance",
      "realYield": "FRED:DFII10",
      "fedRate": "FRED:FEDFUNDS",
      "inflation": "FRED:T5YIE",
      "creditSpread": "FRED:BAMLH0A0HYM2",
      "ratePath": "FRED: DGS2 - FEDFUNDS",
      "vixTermStructure": "Yahoo: ^VIX3M / ^VIX",
      "creditSpreadMomentum": "Calculated: QoQ delta of BAMLH0A0HYM2"
    },
    "returnSources": {
      "cnStock": "ETF:ASHR",
      "hkStock": "ETF:MCHI",
      "usStock": "ETF:SPY",
      "devStock": "ETF:EFA",
      "emStock": "ETF:EEM",
      "bonds_us": "ETF:AGG",
      "bonds_china": "ETF:CBON",
      "bonds_global": "ETF:BNDX",
      "precious": "ETF:GLD",
      "energy": "ETF:XLE",
      "industrial": "ETF:COPX",
      "agriculture": "ETF:DBA",
      "crypto": "ETF:BTC-USD",
      "hedges": "ETF:SHV"
    }
  },
  "quarterly_2018_q1": {
    "period": "2018-Q1",
    "description": "连续季度数据 2018-Q1",
    "quality": "A",
    "macroData": {
      "usd": 90.15,
      "vix": 19.97,
      "cnPolicy": -0.8,
      "cnPolicyTrend": 0.0,
      "momentum": 0.0,
      "adoption": 0.5,
      "btcCycle": 0.4,
      "rateChangeReason": 0.0,
      "usdReason": 0.0,
      "vixReason": 0.0,
      "inflationReason": 0.0,
      "globalGrowth": 3.0,
      "growthTrend": 0.0,
      "inflationTrend": 0.0,
      "usdTrend": 0.0,
      "realYield": 0.71,
      "fedRate": 1.69,
      "inflation": 1.99,
      "creditSpread": 3.71,
      "ratePath": 0.61,
      "vixTermStructure": 1.035,
      "creditSpreadMomentum": 0.23
    },
    "actualReturns": {
      "cnStock": -0.0336,
      "hkStock": -0.0394,
      "usStock": -0.0246,
      "devStock": -0.0344,
      "emStock": -0.0226,
      "bonds_us": -0.0151,
      "bonds_china": 0.0539,
      "bonds_global": 0.0075,
      "precious": 0.0038,
      "energy": -0.0786,
      "industrial": -0.0717,
      "agriculture": -0.0005,
      "crypto": -0.6114,
      "hedges": 0.0031
    },
    "dataSource": "FRED + Yahoo Finance (Auto)",
    "macroSources": {
      "usd": "Yahoo Finance",
      "vix": "Yahoo Finance",
      "realYield": "FRED:DFII10",
      "fedRate": "FRED:FEDFUNDS",
      "inflation": "FRED:T5YIE",
      "creditSpread": "FRED:BAMLH0A0HYM2",
      "cnPolicy": "Manual Override: -0.8",
      "ratePath": "FRED: DGS2 - FEDFUNDS",
      "vixTermStructure": "Yahoo: ^VIX3M / ^VIX",
      "creditSpreadMomentum": "Calculated: QoQ delta of BAMLH0A0HYM2"
    },
    "returnSources": {
      "cnStock": "ETF:ASHR",
      "hkStock": "ETF:MCHI",
      "usStock": "ETF:SPY",
      "devStock": "ETF:EFA",
      "emStock": "ETF:EEM",
      "bonds_us": "ETF:AGG",
      "bonds_china": "ETF:CBON",
      "bonds_global": "ETF:BNDX",
      "precious": "ETF:GLD",
      "energy": "ETF:XLE",
      "industrial": "ETF:COPX",
      "agriculture": "ETF:DBA",
      "crypto": "ETF:BTC-USD",
      "hedges": "ETF:SHV"
    }
  },
  "quarterly_2018_q2": {
    "period": "2018-Q2",
    "description": "连续季度数据 2018-Q2",
    "quality": "A",
    "macroData": {
      "usd": 94.63,
      "vix": 16.09,
      "cnPolicy": -0.6,
      "cnPolicyTrend": 0.0,
      "momentum": 0.5,
      "adoption": 0.5,
      "btcCycle": 0.4,
      "rateChangeReason": 0.0,
      "usdReason": 0.0,
      "vixReason": 0.0,
      "inflationReason": 0.0,
      "globalGrowth": 3.0,
      "growthTrend": 0.0,
      "inflationTrend": 0.0,
      "usdTrend": 0.0,
      "realYield": 0.71,
      "fedRate": 1.91,
      "inflation": 2.08,
      "creditSpread": 3.77,
      "ratePath": 0.64,
      "vixTermStructure": 1.104,
      "creditSpreadMomentum": 0.06
    },
    "actualReturns": {
      "cnStock": -0.1691,
      "hkStock": -0.0429,
      "usStock": 0.0563,
      "devStock": -0.0122,
      "emStock": -0.0845,
      "bonds_us": 0.0011,
      "bonds_china": -0.0391,
      "bonds_global": 0.0047,
      "precious": -0.0581,
      "energy": 0.1242,
      "industrial": -0.0794,
      "agriculture": -0.0566,
      "crypto": 0.0004,
      "hedges": 0.0042
    },
    "dataSource": "FRED + Yahoo Finance (Auto)",
    "macroSources": {
      "usd": "Yahoo Finance",
      "vix": "Yahoo Finance",
      "realYield": "FRED:DFII10",
      "fedRate": "FRED:FEDFUNDS",
      "inflation": "FRED:T5YIE",
      "creditSpread": "FRED:BAMLH0A0HYM2",
      "cnPolicy": "Manual Override: -0.6",
      "ratePath": "FRED: DGS2 - FEDFUNDS",
      "vixTermStructure": "Yahoo: ^VIX3M / ^VIX",
      "creditSpreadMomentum": "Calculated: QoQ delta of BAMLH0A0HYM2"
    },
    "returnSources": {
      "cnStock": "ETF:ASHR",
      "hkStock": "ETF:MCHI",
      "usStock": "ETF:SPY",
      "devStock": "ETF:EFA",
      "emStock": "ETF:EEM",
      "bonds_us": "ETF:AGG",
      "bonds_china": "ETF:CBON",
      "bonds_global": "ETF:BNDX",
      "precious": "ETF:GLD",
      "energy": "ETF:XLE",
      "industrial": "ETF:COPX",
      "agriculture": "ETF:DBA",
      "crypto": "ETF:BTC-USD",
      "hedges": "ETF:SHV"
    }
  },
  "quarterly_2018_q3": {
    "period": "2018-Q3",
    "description": "连续季度数据 2018-Q3",
    "quality": "A",
    "macroData": {
      "usd": 95.19,
      "vix": 12.12,
      "cnPolicy": 0.2,
      "cnPolicyTrend": 0.0,
      "momentum": 0.5,
      "adoption": 0.5,
      "btcCycle": 0.4,
      "rateChangeReason": 0.0,
      "usdReason": 0.0,
      "vixReason": 0.0,
      "inflationReason": 0.0,
      "globalGrowth": 3.0,
      "growthTrend": 0.0,
      "inflationTrend": 0.0,
      "usdTrend": 0.0,
      "realYield": 0.99,
      "fedRate": 2.19,
      "inflation": 2.07,
      "creditSpread": 3.16,
      "ratePath": 0.69,
      "vixTermStructure": 1.096,
      "creditSpreadMomentum": -0.61
    },
    "actualReturns": {
      "cnStock": -0.0335,
      "hkStock": -0.1157,
      "usStock": 0.0498,
      "devStock": -0.0173,
      "emStock": -0.0592,
      "bonds_us": -0.0128,
      "bonds_china": -0.0169,
      "bonds_global": -0.0095,
      "precious": -0.0426,
      "energy": 0.0267,
      "industrial": -0.0976,
      "agriculture": -0.0313,
      "crypto": -0.0076,
      "hedges": 0.0045
    },
    "dataSource": "FRED + Yahoo Finance (Auto)",
    "macroSources": {
      "usd": "Yahoo Finance",
      "vix": "Yahoo Finance",
      "realYield": "FRED:DFII10",
      "fedRate": "FRED:FEDFUNDS",
      "inflation": "FRED:T5YIE",
      "creditSpread": "FRED:BAMLH0A0HYM2",
      "cnPolicy": "Manual Override: 0.2",
      "ratePath": "FRED: DGS2 - FEDFUNDS",
      "vixTermStructure": "Yahoo: ^VIX3M / ^VIX",
      "creditSpreadMomentum": "Calculated: QoQ delta of BAMLH0A0HYM2"
    },
    "returnSources": {
      "cnStock": "ETF:ASHR",
      "hkStock": "ETF:MCHI",
      "usStock": "ETF:SPY",
      "devStock": "ETF:EFA",
      "emStock": "ETF:EEM",
      "bonds_us": "ETF:AGG",
      "bonds_china": "ETF:CBON",
      "bonds_global": "ETF:BNDX",
      "precious": "ETF:GLD",
      "energy": "ETF:XLE",
      "industrial": "ETF:COPX",
      "agriculture": "ETF:DBA",
      "crypto": "ETF:BTC-USD",
      "hedges": "ETF:SHV"
    }
  },
  "quarterly_2018_q4": {
    "period": "2018-Q4",
    "description": "连续季度数据 2018-Q4",
    "quality": "A",
    "macroData": {
      "usd": 96.17,
      "vix": 25.42,
      "cnPolicy": 0.0,
      "cnPolicyTrend": 0.0,
      "momentum": -0.8,
      "adoption": 0.5,
      "btcCycle": 0.4,
      "rateChangeReason": 0.0,
      "usdReason": 0.0,
      "vixReason": 0.0,
      "inflationReason": 0.0,
      "globalGrowth": 3.0,
      "growthTrend": 0.0,
      "inflationTrend": 0.0,
      "usdTrend": 0.0,
      "realYield": 0.88,
      "fedRate": 2.4,
      "inflation": 1.49,
      "creditSpread": 5.44,
      "ratePath": 0.1,
      "vixTermStructure": 1.022,
      "creditSpreadMomentum": 2.28
    },
    "actualReturns": {
      "cnStock": -0.0718,
      "hkStock": -0.0537,
      "usStock": -0.118,
      "devStock": -0.0882,
      "emStock": -0.0136,
      "bonds_us": 0.0322,
      "bonds_china": 0.0182,
      "bonds_global": 0.0249,
      "precious": 0.0671,
      "energy": -0.2168,
      "industrial": -0.1103,
      "agriculture": -0.0132,
      "crypto": -0.4164,
      "hedges": 0.006
    },
    "dataSource": "FRED + Yahoo Finance (Auto)",
    "macroSources": {
      "usd": "Yahoo Finance",
      "vix": "Yahoo Finance",
      "realYield": "FRED:DFII10",
      "fedRate": "FRED:FEDFUNDS",
      "inflation": "FRED:T5YIE",
      "creditSpread": "FRED:BAMLH0A0HYM2",
      "ratePath": "FRED: DGS2 - FEDFUNDS",
      "vixTermStructure": "Yahoo: ^VIX3M / ^VIX",
      "creditSpreadMomentum": "Calculated: QoQ delta of BAMLH0A0HYM2"
    },
    "returnSources": {
      "cnStock": "ETF:ASHR",
      "hkStock": "ETF:MCHI",
      "usStock": "ETF:SPY",
      "devStock": "ETF:EFA",
      "emStock": "ETF:EEM",
      "bonds_us": "ETF:AGG",
      "bonds_china": "ETF:CBON",
      "bonds_global": "ETF:BNDX",
      "precious": "ETF:GLD",
      "energy": "ETF:XLE",
      "industrial": "ETF:COPX",
      "agriculture": "ETF:DBA",
      "crypto": "ETF:BTC-USD",
      "hedges": "ETF:SHV"
    }
  },
  "quarterly_2019_q1": {
    "period": "2019-Q1",
    "description": "连续季度数据 2019-Q1",
    "quality": "A",
    "macroData": {
      "usd": 97.28,
      "vix": 13.71,
      "cnPolicy": 0.0,
      "cnPolicyTrend": 0.0,
      "momentum": 0.8,
      "adoption": 0.5,
      "btcCycle": 0.3,
      "rateChangeReason": 0.0,
      "usdReason": 0.0,
      "vixReason": 0.0,
      "inflationReason": 0.0,
      "globalGrowth": 3.0,
      "growthTrend": 0.0,
      "inflationTrend": 0.0,
      "usdTrend": 0.0,
      "realYield": 0.61,
      "fedRate": 2.42,
      "inflation": 1.81,
      "creditSpread": 3.9,
      "ratePath": -0.07,
      "vixTermStructure": 1.175,
      "creditSpreadMomentum": -1.54
    },
    "actualReturns": {
      "cnStock": 0.3684,
      "hkStock": 0.2233,
      "usStock": 0.1484,
      "devStock": 0.1058,
      "emStock": 0.1187,
      "bonds_us": 0.0235,
      "bonds_china": 0.0329,
      "bonds_global": 0.0275,
      "precious": 0.0044,
      "energy": 0.1381,
      "industrial": 0.2301,
      "agriculture": -0.0018,
      "crypto": 0.2355,
      "hedges": 0.006
    },
    "dataSource": "FRED + Yahoo Finance (Auto)",
    "macroSources": {
      "usd": "Yahoo Finance",
      "vix": "Yahoo Finance",
      "realYield": "FRED:DFII10",
      "fedRate": "FRED:FEDFUNDS",
      "inflation": "FRED:T5YIE",
      "creditSpread": "FRED:BAMLH0A0HYM2",
      "ratePath": "FRED: DGS2 - FEDFUNDS",
      "vixTermStructure": "Yahoo: ^VIX3M / ^VIX",
      "creditSpreadMomentum": "Calculated: QoQ delta of BAMLH0A0HYM2"
    },
    "returnSources": {
      "cnStock": "ETF:ASHR",
      "hkStock": "ETF:MCHI",
      "usStock": "ETF:SPY",
      "devStock": "ETF:EFA",
      "emStock": "ETF:EEM",
      "bonds_us": "ETF:AGG",
      "bonds_china": "ETF:CBON",
      "bonds_global": "ETF:BNDX",
      "precious": "ETF:GLD",
      "energy": "ETF:XLE",
      "industrial": "ETF:COPX",
      "agriculture": "ETF:DBA",
      "crypto": "ETF:BTC-USD",
      "hedges": "ETF:SHV"
    }
  },
  "quarterly_2019_q2": {
    "period": "2019-Q2",
    "description": "连续季度数据 2019-Q2",
    "quality": "A",
    "macroData": {
      "usd": 96.13,
      "vix": 15.08,
      "cnPolicy": 0.0,
      "cnPolicyTrend": 0.0,
      "momentum": 0.5,
      "adoption": 0.5,
      "btcCycle": 0.3,
      "rateChangeReason": 0.0,
      "usdReason": 0.0,
      "vixReason": 0.0,
      "inflationReason": 0.0,
      "globalGrowth": 3.0,
      "growthTrend": 0.0,
      "inflationTrend": 0.0,
      "usdTrend": 0.0,
      "realYield": 0.31,
      "fedRate": 2.4,
      "inflation": 1.51,
      "creditSpread": 4.02,
      "ratePath": -0.53,
      "vixTermStructure": 1.128,
      "creditSpreadMomentum": 0.12
    },
    "actualReturns": {
      "cnStock": -0.0861,
      "hkStock": -0.0753,
      "usStock": 0.0393,
      "devStock": 0.0203,
      "emStock": -0.0257,
      "bonds_us": 0.0321,
      "bonds_china": -0.0143,
      "bonds_global": 0.038,
      "precious": 0.0833,
      "energy": -0.0583,
      "industrial": -0.1014,
      "agriculture": -0.0189,
      "crypto": 1.1697,
      "hedges": 0.0065
    },
    "dataSource": "FRED + Yahoo Finance (Auto)",
    "macroSources": {
      "usd": "Yahoo Finance",
      "vix": "Yahoo Finance",
      "realYield": "FRED:DFII10",
      "fedRate": "FRED:FEDFUNDS",
      "inflation": "FRED:T5YIE",
      "creditSpread": "FRED:BAMLH0A0HYM2",
      "ratePath": "FRED: DGS2 - FEDFUNDS",
      "vixTermStructure": "Yahoo: ^VIX3M / ^VIX",
      "creditSpreadMomentum": "Calculated: QoQ delta of BAMLH0A0HYM2"
    },
    "returnSources": {
      "cnStock": "ETF:ASHR",
      "hkStock": "ETF:MCHI",
      "usStock": "ETF:SPY",
      "devStock": "ETF:EFA",
      "emStock": "ETF:EEM",
      "bonds_us": "ETF:AGG",
      "bonds_china": "ETF:CBON",
      "bonds_global": "ETF:BNDX",
      "precious": "ETF:GLD",
      "energy": "ETF:XLE",
      "industrial": "ETF:COPX",
      "agriculture": "ETF:DBA",
      "crypto": "ETF:BTC-USD",
      "hedges": "ETF:SHV"
    }
  },
  "quarterly_2019_q3": {
    "period": "2019-Q3",
    "description": "连续季度数据 2019-Q3",
    "quality": "A",
    "macroData": {
      "usd": 99.38,
      "vix": 16.24,
      "cnPolicy": 0.0,
      "cnPolicyTrend": 0.0,
      "momentum": 0.0,
      "adoption": 0.5,
      "btcCycle": 0.3,
      "rateChangeReason": 0.0,
      "usdReason": 0.0,
      "vixReason": 0.0,
      "inflationReason": 0.0,
      "globalGrowth": 3.0,
      "growthTrend": 0.0,
      "inflationTrend": 0.0,
      "usdTrend": 0.0,
      "realYield": 0.06,
      "fedRate": 1.83,
      "inflation": 1.25,
      "creditSpread": 4.4,
      "ratePath": -0.43,
      "vixTermStructure": 1.091,
      "creditSpreadMomentum": 0.38
    },
    "actualReturns": {
      "cnStock": -0.0352,
      "hkStock": -0.0496,
      "usStock": -0.0092,
      "devStock": -0.0302,
      "emStock": -0.0457,
      "bonds_us": 0.0317,
      "bonds_china": -0.0202,
      "bonds_global": 0.0262,
      "precious": 0.0739,
      "energy": -0.0822,
      "industrial": -0.1917,
      "agriculture": -0.0494,
      "crypto": -0.2727,
      "hedges": 0.0063
    },
    "dataSource": "FRED + Yahoo Finance (Auto)",
    "macroSources": {
      "usd": "Yahoo Finance",
      "vix": "Yahoo Finance",
      "realYield": "FRED:DFII10",
      "fedRate": "FRED:FEDFUNDS",
      "inflation": "FRED:T5YIE",
      "creditSpread": "FRED:BAMLH0A0HYM2",
      "ratePath": "FRED: DGS2 - FEDFUNDS",
      "vixTermStructure": "Yahoo: ^VIX3M / ^VIX",
      "creditSpreadMomentum": "Calculated: QoQ delta of BAMLH0A0HYM2"
    },
    "returnSources": {
      "cnStock": "ETF:ASHR",
      "hkStock": "ETF:MCHI",
      "usStock": "ETF:SPY",
      "devStock": "ETF:EFA",
      "emStock": "ETF:EEM",
      "bonds_us": "ETF:AGG",
      "bonds_china": "ETF:CBON",
      "bonds_global": "ETF:BNDX",
      "precious": "ETF:GLD",
      "energy": "ETF:XLE",
      "industrial": "ETF:COPX",
      "agriculture": "ETF:DBA",
      "crypto": "ETF:BTC-USD",
      "hedges": "ETF:SHV"
    }
  },
  "quarterly_2019_q4": {
    "period": "2019-Q4",
    "description": "连续季度数据 2019-Q4",
    "quality": "A",
    "macroData": {
      "usd": 96.39,
      "vix": 13.78,
      "cnPolicy": 0.0,
      "cnPolicyTrend": 0.0,
      "momentum": 0.8,
      "adoption": 0.5,
      "btcCycle": 0.3,
      "rateChangeReason": 0.0,
      "usdReason": 0.0,
      "vixReason": 0.0,
      "inflationReason": 0.0,
      "globalGrowth": 3.0,
      "growthTrend": 0.0,
      "inflationTrend": 0.0,
      "usdTrend": 0.0,
      "realYield": 0.03,
      "fedRate": 1.55,
      "inflation": 1.69,
      "creditSpread": 3.61,
      "ratePath": -0.02,
      "vixTermStructure": 1.142,
      "creditSpreadMomentum": -0.79
    },
    "actualReturns": {
      "cnStock": 0.1119,
      "hkStock": 0.1571,
      "usStock": 0.1007,
      "devStock": 0.0916,
      "emStock": 0.1201,
      "bonds_us": -0.001,
      "bonds_china": 0.0298,
      "bonds_global": -0.0095,
      "precious": 0.0279,
      "energy": 0.0947,
      "industrial": 0.2278,
      "agriculture": 0.0505,
      "crypto": -0.0722,
      "hedges": 0.004
    },
    "dataSource": "FRED + Yahoo Finance (Auto)",
    "macroSources": {
      "usd": "Yahoo Finance",
      "vix": "Yahoo Finance",
      "realYield": "FRED:DFII10",
      "fedRate": "FRED:FEDFUNDS",
      "inflation": "FRED:T5YIE",
      "creditSpread": "FRED:BAMLH0A0HYM2",
      "ratePath": "FRED: DGS2 - FEDFUNDS",
      "vixTermStructure": "Yahoo: ^VIX3M / ^VIX",
      "creditSpreadMomentum": "Calculated: QoQ delta of BAMLH0A0HYM2"
    },
    "returnSources": {
      "cnStock": "ETF:ASHR",
      "hkStock": "ETF:MCHI",
      "usStock": "ETF:SPY",
      "devStock": "ETF:EFA",
      "emStock": "ETF:EEM",
      "bonds_us": "ETF:AGG",
      "bonds_china": "ETF:CBON",
      "bonds_global": "ETF:BNDX",
      "precious": "ETF:GLD",
      "energy": "ETF:XLE",
      "industrial": "ETF:COPX",
      "agriculture": "ETF:DBA",
      "crypto": "ETF:BTC-USD",
      "hedges": "ETF:SHV"
    }
  },
  "quarterly_2020_q1": {
    "period": "2020-Q1",
    "description": "连续季度数据 2020-Q1",
    "quality": "A",
    "macroData": {
      "usd": 99.05,
      "vix": 53.54,
      "cnPolicy": 0.8,
      "cnPolicyTrend": 0.0,
      "momentum": -0.8,
      "adoption": 0.5,
      "btcCycle": 0.5,
      "rateChangeReason": 0.0,
      "usdReason": 0.0,
      "vixReason": 0.0,
      "inflationReason": 0.0,
      "globalGrowth": 3.0,
      "growthTrend": 0.0,
      "inflationTrend": 0.0,
      "usdTrend": 0.0,
      "realYield": -0.46,
      "fedRate": 0.05,
      "inflation": 0.78,
      "creditSpread": 9.43,
      "ratePath": 0.18,
      "vixTermStructure": 0.958,
      "creditSpreadMomentum": 5.82
    },
    "actualReturns": {
      "cnStock": -0.1256,
      "hkStock": -0.1338,
      "usStock": -0.2286,
      "devStock": -0.268,
      "emStock": -0.2608,
      "bonds_us": 0.0247,
      "bonds_china": -0.0012,
      "bonds_global": -0.0099,
      "precious": 0.0357,
      "energy": -0.499,
      "industrial": -0.4316,
      "agriculture": -0.1774,
      "crypto": -0.1259,
      "hedges": 0.0078
    },
    "dataSource": "FRED + Yahoo Finance (Auto)",
    "macroSources": {
      "usd": "Yahoo Finance",
      "vix": "Yahoo Finance",
      "realYield": "FRED:DFII10",
      "fedRate": "FRED:FEDFUNDS",
      "inflation": "FRED:T5YIE",
      "creditSpread": "FRED:BAMLH0A0HYM2",
      "cnPolicy": "Manual Override: 0.8",
      "ratePath": "FRED: DGS2 - FEDFUNDS",
      "vixTermStructure": "Yahoo: ^VIX3M / ^VIX",
      "creditSpreadMomentum": "Calculated: QoQ delta of BAMLH0A0HYM2"
    },
    "returnSources": {
      "cnStock": "ETF:ASHR",
      "hkStock": "ETF:MCHI",
      "usStock": "ETF:SPY",
      "devStock": "ETF:EFA",
      "emStock": "ETF:EEM",
      "bonds_us": "ETF:AGG",
      "bonds_china": "ETF:CBON",
      "bonds_global": "ETF:BNDX",
      "precious": "ETF:GLD",
      "energy": "ETF:XLE",
      "industrial": "ETF:COPX",
      "agriculture": "ETF:DBA",
      "crypto": "ETF:BTC-USD",
      "hedges": "ETF:SHV"
    }
  },
  "quarterly_2020_q2": {
    "period": "2020-Q2",
    "description": "连续季度数据 2020-Q2",
    "quality": "A",
    "macroData": {
      "usd": 97.39,
      "vix": 30.43,
      "cnPolicy": 0.6,
      "cnPolicyTrend": 0.0,
      "momentum": 0.8,
      "adoption": 0.5,
      "btcCycle": 0.5,
      "rateChangeReason": 0.0,
      "usdReason": 0.0,
      "vixReason": 0.0,
      "inflationReason": 0.0,
      "globalGrowth": 3.0,
      "growthTrend": 0.0,
      "inflationTrend": 0.0,
      "usdTrend": 0.0,
      "realYield": -0.73,
      "fedRate": 0.09,
      "inflation": 1.21,
      "creditSpread": 6.17,
      "ratePath": NaN,
      "vixTermStructure": 1.115,
      "creditSpreadMomentum": -3.26
    },
    "actualReturns": {
      "cnStock": 0.1611,
      "hkStock": 0.1727,
      "usStock": 0.184,
      "devStock": 0.1688,
      "emStock": 0.1906,
      "bonds_us": 0.0288,
      "bonds_china": 0.016,
      "bonds_global": 0.0242,
      "precious": 0.0644,
      "energy": 0.204,
      "industrial": 0.4888,
      "agriculture": 0.0,
      "crypto": 0.2478,
      "hedges": -0.0001
    },
    "dataSource": "FRED + Yahoo Finance (Auto)",
    "macroSources": {
      "usd": "Yahoo Finance",
      "vix": "Yahoo Finance",
      "realYield": "FRED:DFII10",
      "fedRate": "FRED:FEDFUNDS",
      "inflation": "FRED:T5YIE",
      "creditSpread": "FRED:BAMLH0A0HYM2",
      "cnPolicy": "Manual Override: 0.6",
      "ratePath": "FRED: DGS2 - FEDFUNDS",
      "vixTermStructure": "Yahoo: ^VIX3M / ^VIX",
      "creditSpreadMomentum": "Calculated: QoQ delta of BAMLH0A0HYM2"
    },
    "returnSources": {
      "cnStock": "ETF:ASHR",
      "hkStock": "ETF:MCHI",
      "usStock": "ETF:SPY",
      "devStock": "ETF:EFA",
      "emStock": "ETF:EEM",
      "bonds_us": "ETF:AGG",
      "bonds_china": "ETF:CBON",
      "bonds_global": "ETF:BNDX",
      "precious": "ETF:GLD",
      "energy": "ETF:XLE",
      "industrial": "ETF:COPX",
      "agriculture": "ETF:DBA",
      "crypto": "ETF:BTC-USD",
      "hedges": "ETF:SHV"
    }
  },
  "quarterly_2020_q3": {
    "period": "2020-Q3",
    "description": "连续季度数据 2020-Q3",
    "quality": "A",
    "macroData": {
      "usd": 93.89,
      "vix": 26.37,
      "cnPolicy": 0.2,
      "cnPolicyTrend": 0.0,
      "momentum": 0.5,
      "adoption": 0.5,
      "btcCycle": 0.5,
      "rateChangeReason": 0.0,
      "usdReason": 0.0,
      "vixReason": 0.0,
      "inflationReason": 0.0,
      "globalGrowth": 3.0,
      "growthTrend": 0.0,
      "inflationTrend": 0.0,
      "usdTrend": 0.0,
      "realYield": -0.94,
      "fedRate": 0.09,
      "inflation": 1.48,
      "creditSpread": 5.38,
      "ratePath": 0.05,
      "vixTermStructure": 1.119,
      "creditSpreadMomentum": -0.79
    },
    "actualReturns": {
      "cnStock": 0.0121,
      "hkStock": 0.0163,
      "usStock": 0.0759,
      "devStock": 0.0331,
      "emStock": 0.0334,
      "bonds_us": -0.0005,
      "bonds_china": 0.0511,
      "bonds_global": 0.0099,
      "precious": 0.068,
      "energy": -0.1806,
      "industrial": 0.12,
      "agriculture": 0.0848,
      "crypto": 0.1512,
      "hedges": 0.0
    },
    "dataSource": "FRED + Yahoo Finance (Auto)",
    "macroSources": {
      "usd": "Yahoo Finance",
      "vix": "Yahoo Finance",
      "realYield": "FRED:DFII10",
      "fedRate": "FRED:FEDFUNDS",
      "inflation": "FRED:T5YIE",
      "creditSpread": "FRED:BAMLH0A0HYM2",
      "cnPolicy": "Manual Override: 0.2",
      "ratePath": "FRED: DGS2 - FEDFUNDS",
      "vixTermStructure": "Yahoo: ^VIX3M / ^VIX",
      "creditSpreadMomentum": "Calculated: QoQ delta of BAMLH0A0HYM2"
    },
    "returnSources": {
      "cnStock": "ETF:ASHR",
      "hkStock": "ETF:MCHI",
      "usStock": "ETF:SPY",
      "devStock": "ETF:EFA",
      "emStock": "ETF:EEM",
      "bonds_us": "ETF:AGG",
      "bonds_china": "ETF:CBON",
      "bonds_global": "ETF:BNDX",
      "precious": "ETF:GLD",
      "energy": "ETF:XLE",
      "industrial": "ETF:COPX",
      "agriculture": "ETF:DBA",
      "crypto": "ETF:BTC-USD",
      "hedges": "ETF:SHV"
    }
  },
  "quarterly_2020_q4": {
    "period": "2020-Q4",
    "description": "连续季度数据 2020-Q4",
    "quality": "A",
    "macroData": {
      "usd": 89.94,
      "vix": 22.75,
      "cnPolicy": 0.0,
      "cnPolicyTrend": 0.0,
      "momentum": 0.8,
      "adoption": 0.5,
      "btcCycle": 0.5,
      "rateChangeReason": 0.0,
      "usdReason": 0.0,
      "vixReason": 0.0,
      "inflationReason": 0.0,
      "globalGrowth": 3.0,
      "growthTrend": 0.0,
      "inflationTrend": 0.0,
      "usdTrend": 0.0,
      "realYield": -1.06,
      "fedRate": 0.09,
      "inflation": 1.95,
      "creditSpread": 3.86,
      "ratePath": 0.04,
      "vixTermStructure": 1.075,
      "creditSpreadMomentum": -1.52
    },
    "actualReturns": {
      "cnStock": 0.2053,
      "hkStock": 0.1259,
      "usStock": 0.1134,
      "devStock": 0.166,
      "emStock": 0.2047,
      "bonds_us": 0.007,
      "bonds_china": 0.0487,
      "bonds_global": 0.0105,
      "precious": 0.0314,
      "energy": 0.3514,
      "industrial": 0.6035,
      "agriculture": 0.1013,
      "crypto": 2.2055,
      "hedges": -0.0001
    },
    "dataSource": "FRED + Yahoo Finance (Auto)",
    "macroSources": {
      "usd": "Yahoo Finance",
      "vix": "Yahoo Finance",
      "realYield": "FRED:DFII10",
      "fedRate": "FRED:FEDFUNDS",
      "inflation": "FRED:T5YIE",
      "creditSpread": "FRED:BAMLH0A0HYM2",
      "ratePath": "FRED: DGS2 - FEDFUNDS",
      "vixTermStructure": "Yahoo: ^VIX3M / ^VIX",
      "creditSpreadMomentum": "Calculated: QoQ delta of BAMLH0A0HYM2"
    },
    "returnSources": {
      "cnStock": "ETF:ASHR",
      "hkStock": "ETF:MCHI",
      "usStock": "ETF:SPY",
      "devStock": "ETF:EFA",
      "emStock": "ETF:EEM",
      "bonds_us": "ETF:AGG",
      "bonds_china": "ETF:CBON",
      "bonds_global": "ETF:BNDX",
      "precious": "ETF:GLD",
      "energy": "ETF:XLE",
      "industrial": "ETF:COPX",
      "agriculture": "ETF:DBA",
      "crypto": "ETF:BTC-USD",
      "hedges": "ETF:SHV"
    }
  },
  "quarterly_2021_q1": {
    "period": "2021-Q1",
    "description": "连续季度数据 2021-Q1",
    "quality": "A",
    "macroData": {
      "usd": 93.23,
      "vix": 19.4,
      "cnPolicy": -0.5,
      "cnPolicyTrend": 0.0,
      "momentum": 0.8,
      "adoption": 0.6,
      "btcCycle": 0.75,
      "rateChangeReason": 0.0,
      "usdReason": 0.0,
      "vixReason": 0.0,
      "inflationReason": 0.0,
      "globalGrowth": 3.0,
      "growthTrend": 0.0,
      "inflationTrend": 0.0,
      "usdTrend": 0.0,
      "realYield": -0.64,
      "fedRate": 0.07,
      "inflation": 2.58,
      "creditSpread": 3.33,
      "ratePath": 0.1,
      "vixTermStructure": 1.17,
      "creditSpreadMomentum": -0.53
    },
    "actualReturns": {
      "cnStock": -0.0632,
      "hkStock": 0.0119,
      "usStock": 0.0914,
      "devStock": 0.0404,
      "emStock": 0.0241,
      "bonds_us": -0.0254,
      "bonds_china": -0.0119,
      "bonds_global": -0.0207,
      "precious": -0.0999,
      "energy": 0.2144,
      "industrial": 0.1314,
      "agriculture": 0.049,
      "crypto": 0.6038,
      "hedges": -0.0002
    },
    "dataSource": "FRED + Yahoo Finance (Auto)",
    "macroSources": {
      "usd": "Yahoo Finance",
      "vix": "Yahoo Finance",
      "realYield": "FRED:DFII10",
      "fedRate": "FRED:FEDFUNDS",
      "inflation": "FRED:T5YIE",
      "creditSpread": "FRED:BAMLH0A0HYM2",
      "cnPolicy": "Manual Override: -0.5",
      "ratePath": "FRED: DGS2 - FEDFUNDS",
      "vixTermStructure": "Yahoo: ^VIX3M / ^VIX",
      "creditSpreadMomentum": "Calculated: QoQ delta of BAMLH0A0HYM2"
    },
    "returnSources": {
      "cnStock": "ETF:ASHR",
      "hkStock": "ETF:MCHI",
      "usStock": "ETF:SPY",
      "devStock": "ETF:EFA",
      "emStock": "ETF:EEM",
      "bonds_us": "ETF:AGG",
      "bonds_china": "ETF:CBON",
      "bonds_global": "ETF:BNDX",
      "precious": "ETF:GLD",
      "energy": "ETF:XLE",
      "industrial": "ETF:COPX",
      "agriculture": "ETF:DBA",
      "crypto": "ETF:BTC-USD",
      "hedges": "ETF:SHV"
    }
  },
  "quarterly_2021_q2": {
    "period": "2021-Q2",
    "description": "连续季度数据 2021-Q2",
    "quality": "A",
    "macroData": {
      "usd": 92.44,
      "vix": 15.83,
      "cnPolicy": -0.8,
      "cnPolicyTrend": 0.0,
      "momentum": 0.5,
      "adoption": 0.6,
      "btcCycle": 0.75,
      "rateChangeReason": 0.0,
      "usdReason": 0.0,
      "vixReason": 0.0,
      "inflationReason": 0.0,
      "globalGrowth": 3.0,
      "growthTrend": 0.0,
      "inflationTrend": 0.0,
      "usdTrend": 0.0,
      "realYield": -0.89,
      "fedRate": 0.1,
      "inflation": 2.49,
      "creditSpread": 3.04,
      "ratePath": NaN,
      "vixTermStructure": 1.281,
      "creditSpreadMomentum": -0.29
    },
    "actualReturns": {
      "cnStock": 0.0043,
      "hkStock": -0.0382,
      "usStock": 0.0715,
      "devStock": 0.0424,
      "emStock": 0.012,
      "bonds_us": 0.0144,
      "bonds_china": 0.0146,
      "bonds_global": 0.002,
      "precious": 0.0249,
      "energy": 0.128,
      "industrial": -0.009,
      "agriculture": 0.0769,
      "crypto": -0.4201,
      "hedges": -0.0004
    },
    "dataSource": "FRED + Yahoo Finance (Auto)",
    "macroSources": {
      "usd": "Yahoo Finance",
      "vix": "Yahoo Finance",
      "realYield": "FRED:DFII10",
      "fedRate": "FRED:FEDFUNDS",
      "inflation": "FRED:T5YIE",
      "creditSpread": "FRED:BAMLH0A0HYM2",
      "cnPolicy": "Manual Override: -0.8",
      "ratePath": "FRED: DGS2 - FEDFUNDS",
      "vixTermStructure": "Yahoo: ^VIX3M / ^VIX",
      "creditSpreadMomentum": "Calculated: QoQ delta of BAMLH0A0HYM2"
    },
    "returnSources": {
      "cnStock": "ETF:ASHR",
      "hkStock": "ETF:MCHI",
      "usStock": "ETF:SPY",
      "devStock": "ETF:EFA",
      "emStock": "ETF:EEM",
      "bonds_us": "ETF:AGG",
      "bonds_china": "ETF:CBON",
      "bonds_global": "ETF:BNDX",
      "precious": "ETF:GLD",
      "energy": "ETF:XLE",
      "industrial": "ETF:COPX",
      "agriculture": "ETF:DBA",
      "crypto": "ETF:BTC-USD",
      "hedges": "ETF:SHV"
    }
  },
  "quarterly_2021_q3": {
    "period": "2021-Q3",
    "description": "连续季度数据 2021-Q3",
    "quality": "A",
    "macroData": {
      "usd": 94.25,
      "vix": 23.14,
      "cnPolicy": -1.0,
      "cnPolicyTrend": 0.0,
      "momentum": 0.0,
      "adoption": 0.6,
      "btcCycle": 0.75,
      "rateChangeReason": 0.0,
      "usdReason": 0.0,
      "vixReason": 0.0,
      "inflationReason": 0.0,
      "globalGrowth": 3.0,
      "growthTrend": 0.0,
      "inflationTrend": 0.0,
      "usdTrend": 0.0,
      "realYield": -0.9,
      "fedRate": 0.08,
      "inflation": 2.51,
      "creditSpread": 3.2,
      "ratePath": 0.2,
      "vixTermStructure": 1.085,
      "creditSpreadMomentum": 0.16
    },
    "actualReturns": {
      "cnStock": -0.0505,
      "hkStock": -0.1554,
      "usStock": 0.0036,
      "devStock": -0.0115,
      "emStock": -0.0721,
      "bonds_us": -0.0049,
      "bonds_china": 0.0163,
      "bonds_global": -0.0077,
      "precious": -0.021,
      "energy": 0.0529,
      "industrial": -0.04,
      "agriculture": 0.0791,
      "crypto": 0.5047,
      "hedges": -0.0002
    },
    "dataSource": "FRED + Yahoo Finance (Auto)",
    "macroSources": {
      "usd": "Yahoo Finance",
      "vix": "Yahoo Finance",
      "realYield": "FRED:DFII10",
      "fedRate": "FRED:FEDFUNDS",
      "inflation": "FRED:T5YIE",
      "creditSpread": "FRED:BAMLH0A0HYM2",
      "cnPolicy": "Manual Override: -1.0",
      "ratePath": "FRED: DGS2 - FEDFUNDS",
      "vixTermStructure": "Yahoo: ^VIX3M / ^VIX",
      "creditSpreadMomentum": "Calculated: QoQ delta of BAMLH0A0HYM2"
    },
    "returnSources": {
      "cnStock": "ETF:ASHR",
      "hkStock": "ETF:MCHI",
      "usStock": "ETF:SPY",
      "devStock": "ETF:EFA",
      "emStock": "ETF:EEM",
      "bonds_us": "ETF:AGG",
      "bonds_china": "ETF:CBON",
      "bonds_global": "ETF:BNDX",
      "precious": "ETF:GLD",
      "energy": "ETF:XLE",
      "industrial": "ETF:COPX",
      "agriculture": "ETF:DBA",
      "crypto": "ETF:BTC-USD",
      "hedges": "ETF:SHV"
    }
  },
  "quarterly_2021_q4": {
    "period": "2021-Q4",
    "description": "连续季度数据 2021-Q4",
    "quality": "A",
    "macroData": {
      "usd": 95.67,
      "vix": 17.22,
      "cnPolicy": -0.8,
      "cnPolicyTrend": 0.0,
      "momentum": 0.8,
      "adoption": 0.6,
      "btcCycle": 0.75,
      "rateChangeReason": 0.0,
      "usdReason": 0.0,
      "vixReason": 0.0,
      "inflationReason": 0.0,
      "globalGrowth": 3.0,
      "growthTrend": 0.0,
      "inflationTrend": 0.0,
      "usdTrend": 0.0,
      "realYield": -0.97,
      "fedRate": 0.08,
      "inflation": 2.95,
      "creditSpread": 3.05,
      "ratePath": 0.75,
      "vixTermStructure": 1.19,
      "creditSpreadMomentum": -0.15
    },
    "actualReturns": {
      "cnStock": 0.0276,
      "hkStock": -0.0805,
      "usStock": 0.0808,
      "devStock": 0.0399,
      "emStock": -0.0144,
      "bonds_us": -0.0114,
      "bonds_china": 0.0243,
      "bonds_global": -0.005,
      "precious": 0.0244,
      "energy": 0.1009,
      "industrial": 0.0896,
      "agriculture": 0.025,
      "crypto": -0.213,
      "hedges": -0.0007
    },
    "dataSource": "FRED + Yahoo Finance (Auto)",
    "macroSources": {
      "usd": "Yahoo Finance",
      "vix": "Yahoo Finance",
      "realYield": "FRED:DFII10",
      "fedRate": "FRED:FEDFUNDS",
      "inflation": "FRED:T5YIE",
      "creditSpread": "FRED:BAMLH0A0HYM2",
      "cnPolicy": "Manual Override: -0.8",
      "ratePath": "FRED: DGS2 - FEDFUNDS",
      "vixTermStructure": "Yahoo: ^VIX3M / ^VIX",
      "creditSpreadMomentum": "Calculated: QoQ delta of BAMLH0A0HYM2"
    },
    "returnSources": {
      "cnStock": "ETF:ASHR",
      "hkStock": "ETF:MCHI",
      "usStock": "ETF:SPY",
      "devStock": "ETF:EFA",
      "emStock": "ETF:EEM",
      "bonds_us": "ETF:AGG",
      "bonds_china": "ETF:CBON",
      "bonds_global": "ETF:BNDX",
      "precious": "ETF:GLD",
      "energy": "ETF:XLE",
      "industrial": "ETF:COPX",
      "agriculture": "ETF:DBA",
      "crypto": "ETF:BTC-USD",
      "hedges": "ETF:SHV"
    }
  },
  "quarterly_2022_q1": {
    "period": "2022-Q1",
    "description": "连续季度数据 2022-Q1",
    "quality": "A",
    "macroData": {
      "usd": 98.31,
      "vix": 20.56,
      "cnPolicy": 0.0,
      "cnPolicyTrend": 0.0,
      "momentum": -0.5,
      "adoption": 0.6,
      "btcCycle": 0.4,
      "rateChangeReason": 0.0,
      "usdReason": 0.0,
      "vixReason": 0.0,
      "inflationReason": 0.0,
      "globalGrowth": 3.0,
      "growthTrend": 0.0,
      "inflationTrend": 0.0,
      "usdTrend": 0.0,
      "realYield": -0.41,
      "fedRate": 0.33,
      "inflation": 3.28,
      "creditSpread": 3.4,
      "ratePath": 2.18,
      "vixTermStructure": 1.184,
      "creditSpreadMomentum": 0.35
    },
    "actualReturns": {
      "cnStock": -0.1233,
      "hkStock": -0.1,
      "usStock": -0.0331,
      "devStock": -0.0632,
      "emStock": -0.0537,
      "bonds_us": -0.0584,
      "bonds_china": 0.0033,
      "bonds_global": -0.0486,
      "precious": 0.0734,
      "energy": 0.2672,
      "industrial": 0.2397,
      "agriculture": 0.1169,
      "crypto": 0.0555,
      "hedges": -0.0016
    },
    "dataSource": "FRED + Yahoo Finance (Auto)",
    "macroSources": {
      "usd": "Yahoo Finance",
      "vix": "Yahoo Finance",
      "realYield": "FRED:DFII10",
      "fedRate": "FRED:FEDFUNDS",
      "inflation": "FRED:T5YIE",
      "creditSpread": "FRED:BAMLH0A0HYM2",
      "ratePath": "FRED: DGS2 - FEDFUNDS",
      "vixTermStructure": "Yahoo: ^VIX3M / ^VIX",
      "creditSpreadMomentum": "Calculated: QoQ delta of BAMLH0A0HYM2"
    },
    "returnSources": {
      "cnStock": "ETF:ASHR",
      "hkStock": "ETF:MCHI",
      "usStock": "ETF:SPY",
      "devStock": "ETF:EFA",
      "emStock": "ETF:EEM",
      "bonds_us": "ETF:AGG",
      "bonds_china": "ETF:CBON",
      "bonds_global": "ETF:BNDX",
      "precious": "ETF:GLD",
      "energy": "ETF:XLE",
      "industrial": "ETF:COPX",
      "agriculture": "ETF:DBA",
      "crypto": "ETF:BTC-USD",
      "hedges": "ETF:SHV"
    }
  },
  "quarterly_2022_q2": {
    "period": "2022-Q2",
    "description": "连续季度数据 2022-Q2",
    "quality": "A",
    "macroData": {
      "usd": 104.69,
      "vix": 28.71,
      "cnPolicy": 0.0,
      "cnPolicyTrend": 0.0,
      "momentum": -0.8,
      "adoption": 0.6,
      "btcCycle": 0.4,
      "rateChangeReason": 0.0,
      "usdReason": 0.0,
      "vixReason": 0.0,
      "inflationReason": 0.0,
      "globalGrowth": 3.0,
      "growthTrend": 0.0,
      "inflationTrend": 0.0,
      "usdTrend": 0.0,
      "realYield": 0.54,
      "fedRate": 1.68,
      "inflation": 2.6,
      "creditSpread": 5.92,
      "ratePath": 1.14,
      "vixTermStructure": 1.049,
      "creditSpreadMomentum": 2.52
    },
    "actualReturns": {
      "cnStock": 0.0177,
      "hkStock": 0.0354,
      "usStock": -0.1409,
      "devStock": -0.1382,
      "emStock": -0.1188,
      "bonds_us": -0.0228,
      "bonds_china": -0.0444,
      "bonds_global": -0.0387,
      "precious": -0.083,
      "energy": -0.0775,
      "industrial": -0.3529,
      "agriculture": -0.1097,
      "crypto": -0.5327,
      "hedges": 0.0002
    },
    "dataSource": "FRED + Yahoo Finance (Auto)",
    "macroSources": {
      "usd": "Yahoo Finance",
      "vix": "Yahoo Finance",
      "realYield": "FRED:DFII10",
      "fedRate": "FRED:FEDFUNDS",
      "inflation": "FRED:T5YIE",
      "creditSpread": "FRED:BAMLH0A0HYM2",
      "ratePath": "FRED: DGS2 - FEDFUNDS",
      "vixTermStructure": "Yahoo: ^VIX3M / ^VIX",
      "creditSpreadMomentum": "Calculated: QoQ delta of BAMLH0A0HYM2"
    },
    "returnSources": {
      "cnStock": "ETF:ASHR",
      "hkStock": "ETF:MCHI",
      "usStock": "ETF:SPY",
      "devStock": "ETF:EFA",
      "emStock": "ETF:EEM",
      "bonds_us": "ETF:AGG",
      "bonds_china": "ETF:CBON",
      "bonds_global": "ETF:BNDX",
      "precious": "ETF:GLD",
      "energy": "ETF:XLE",
      "industrial": "ETF:COPX",
      "agriculture": "ETF:DBA",
      "crypto": "ETF:BTC-USD",
      "hedges": "ETF:SHV"
    }
  },
  "quarterly_2022_q3": {
    "period": "2022-Q3",
    "description": "连续季度数据 2022-Q3",
    "quality": "A",
    "macroData": {
      "usd": 112.12,
      "vix": 31.62,
      "cnPolicy": 0.0,
      "cnPolicyTrend": 0.0,
      "momentum": 0.0,
      "adoption": 0.6,
      "btcCycle": 0.4,
      "rateChangeReason": 0.0,
      "usdReason": 0.0,
      "vixReason": 0.0,
      "inflationReason": 0.0,
      "globalGrowth": 3.0,
      "growthTrend": 0.0,
      "inflationTrend": 0.0,
      "usdTrend": 0.0,
      "realYield": 1.43,
      "fedRate": 3.08,
      "inflation": 2.26,
      "creditSpread": 5.43,
      "ratePath": 1.07,
      "vixTermStructure": 1.031,
      "creditSpreadMomentum": -0.49
    },
    "actualReturns": {
      "cnStock": -0.1523,
      "hkStock": -0.1836,
      "usStock": -0.012,
      "devStock": -0.0419,
      "emStock": -0.0679,
      "bonds_us": -0.045,
      "bonds_china": -0.0421,
      "bonds_global": -0.0347,
      "precious": -0.0144,
      "energy": 0.1952,
      "industrial": 0.0698,
      "agriculture": 0.0305,
      "crypto": -0.0189,
      "hedges": 0.0029
    },
    "dataSource": "FRED + Yahoo Finance (Auto)",
    "macroSources": {
      "usd": "Yahoo Finance",
      "vix": "Yahoo Finance",
      "realYield": "FRED:DFII10",
      "fedRate": "FRED:FEDFUNDS",
      "inflation": "FRED:T5YIE",
      "creditSpread": "FRED:BAMLH0A0HYM2",
      "ratePath": "FRED: DGS2 - FEDFUNDS",
      "vixTermStructure": "Yahoo: ^VIX3M / ^VIX",
      "creditSpreadMomentum": "Calculated: QoQ delta of BAMLH0A0HYM2"
    },
    "returnSources": {
      "cnStock": "ETF:ASHR",
      "hkStock": "ETF:MCHI",
      "usStock": "ETF:SPY",
      "devStock": "ETF:EFA",
      "emStock": "ETF:EEM",
      "bonds_us": "ETF:AGG",
      "bonds_china": "ETF:CBON",
      "bonds_global": "ETF:BNDX",
      "precious": "ETF:GLD",
      "energy": "ETF:XLE",
      "industrial": "ETF:COPX",
      "agriculture": "ETF:DBA",
      "crypto": "ETF:BTC-USD",
      "hedges": "ETF:SHV"
    }
  },
  "quarterly_2022_q4": {
    "period": "2022-Q4",
    "description": "连续季度数据 2022-Q4",
    "quality": "A",
    "macroData": {
      "usd": 103.52,
      "vix": 21.67,
      "cnPolicy": 0.0,
      "cnPolicyTrend": 0.0,
      "momentum": 0.0,
      "adoption": 0.6,
      "btcCycle": 0.4,
      "rateChangeReason": 0.0,
      "usdReason": 0.0,
      "vixReason": 0.0,
      "inflationReason": 0.0,
      "globalGrowth": 3.0,
      "growthTrend": 0.0,
      "inflationTrend": 0.0,
      "usdTrend": 0.0,
      "realYield": 1.53,
      "fedRate": 4.33,
      "inflation": 2.29,
      "creditSpread": 4.7,
      "ratePath": 0.12,
      "vixTermStructure": 1.072,
      "creditSpreadMomentum": -0.73
    },
    "actualReturns": {
      "cnStock": 0.05,
      "hkStock": 0.1915,
      "usStock": 0.0212,
      "devStock": 0.1549,
      "emStock": 0.0944,
      "bonds_us": 0.0251,
      "bonds_china": 0.0185,
      "bonds_global": 0.0115,
      "precious": 0.0682,
      "energy": 0.0531,
      "industrial": 0.256,
      "agriculture": -0.0206,
      "crypto": -0.1563,
      "hedges": 0.0085
    },
    "dataSource": "FRED + Yahoo Finance (Auto)",
    "macroSources": {
      "usd": "Yahoo Finance",
      "vix": "Yahoo Finance",
      "realYield": "FRED:DFII10",
      "fedRate": "FRED:FEDFUNDS",
      "inflation": "FRED:T5YIE",
      "creditSpread": "FRED:BAMLH0A0HYM2",
      "ratePath": "FRED: DGS2 - FEDFUNDS",
      "vixTermStructure": "Yahoo: ^VIX3M / ^VIX",
      "creditSpreadMomentum": "Calculated: QoQ delta of BAMLH0A0HYM2"
    },
    "returnSources": {
      "cnStock": "ETF:ASHR",
      "hkStock": "ETF:MCHI",
      "usStock": "ETF:SPY",
      "devStock": "ETF:EFA",
      "emStock": "ETF:EEM",
      "bonds_us": "ETF:AGG",
      "bonds_china": "ETF:CBON",
      "bonds_global": "ETF:BNDX",
      "precious": "ETF:GLD",
      "energy": "ETF:XLE",
      "industrial": "ETF:COPX",
      "agriculture": "ETF:DBA",
      "crypto": "ETF:BTC-USD",
      "hedges": "ETF:SHV"
    }
  },
  "quarterly_2023_q1": {
    "period": "2023-Q1",
    "description": "连续季度数据 2023-Q1",
    "quality": "A",
    "macroData": {
      "usd": 102.51,
      "vix": 18.7,
      "cnPolicy": 0.0,
      "cnPolicyTrend": 0.0,
      "momentum": 0.5,
      "adoption": 0.6,
      "btcCycle": 0.3,
      "rateChangeReason": 0.0,
      "usdReason": 0.0,
      "vixReason": 0.0,
      "inflationReason": 0.0,
      "globalGrowth": 3.0,
      "growthTrend": 0.0,
      "inflationTrend": 0.0,
      "usdTrend": 0.0,
      "realYield": 1.14,
      "fedRate": 4.83,
      "inflation": 2.39,
      "creditSpread": 4.58,
      "ratePath": -1.04,
      "vixTermStructure": 1.126,
      "creditSpreadMomentum": -0.12
    },
    "actualReturns": {
      "cnStock": 0.0054,
      "hkStock": -0.0599,
      "usStock": 0.0543,
      "devStock": 0.0509,
      "emStock": -0.021,
      "bonds_us": 0.0221,
      "bonds_china": 0.0014,
      "bonds_global": 0.0196,
      "precious": 0.0813,
      "energy": -0.0042,
      "industrial": 0.0008,
      "agriculture": 0.0455,
      "crypto": 0.6622,
      "hedges": 0.0115
    },
    "dataSource": "FRED + Yahoo Finance (Auto)",
    "macroSources": {
      "usd": "Yahoo Finance",
      "vix": "Yahoo Finance",
      "realYield": "FRED:DFII10",
      "fedRate": "FRED:FEDFUNDS",
      "inflation": "FRED:T5YIE",
      "creditSpread": "FRED:BAMLH0A0HYM2",
      "ratePath": "FRED: DGS2 - FEDFUNDS",
      "vixTermStructure": "Yahoo: ^VIX3M / ^VIX",
      "creditSpreadMomentum": "Calculated: QoQ delta of BAMLH0A0HYM2"
    },
    "returnSources": {
      "cnStock": "ETF:ASHR",
      "hkStock": "ETF:MCHI",
      "usStock": "ETF:SPY",
      "devStock": "ETF:EFA",
      "emStock": "ETF:EEM",
      "bonds_us": "ETF:AGG",
      "bonds_china": "ETF:CBON",
      "bonds_global": "ETF:BNDX",
      "precious": "ETF:GLD",
      "energy": "ETF:XLE",
      "industrial": "ETF:COPX",
      "agriculture": "ETF:DBA",
      "crypto": "ETF:BTC-USD",
      "hedges": "ETF:SHV"
    }
  },
  "quarterly_2023_q2": {
    "period": "2023-Q2",
    "description": "连续季度数据 2023-Q2",
    "quality": "A",
    "macroData": {
      "usd": 102.91,
      "vix": 13.59,
      "cnPolicy": 0.0,
      "cnPolicyTrend": 0.0,
      "momentum": 0.8,
      "adoption": 0.6,
      "btcCycle": 0.3,
      "rateChangeReason": 0.0,
      "usdReason": 0.0,
      "vixReason": 0.0,
      "inflationReason": 0.0,
      "globalGrowth": 3.0,
      "growthTrend": 0.0,
      "inflationTrend": 0.0,
      "usdTrend": 0.0,
      "realYield": 1.61,
      "fedRate": 5.12,
      "inflation": 2.21,
      "creditSpread": 3.99,
      "ratePath": -0.18,
      "vixTermStructure": 1.164,
      "creditSpreadMomentum": -0.59
    },
    "actualReturns": {
      "cnStock": -0.1022,
      "hkStock": -0.0846,
      "usStock": 0.087,
      "devStock": 0.0137,
      "emStock": 0.0173,
      "bonds_us": -0.0254,
      "bonds_china": -0.0255,
      "bonds_global": -0.0047,
      "precious": -0.0464,
      "energy": -0.0395,
      "industrial": -0.0113,
      "agriculture": 0.0286,
      "crypto": 0.0881,
      "hedges": 0.0104
    },
    "dataSource": "FRED + Yahoo Finance (Auto)",
    "macroSources": {
      "usd": "Yahoo Finance",
      "vix": "Yahoo Finance",
      "realYield": "FRED:DFII10",
      "fedRate": "FRED:FEDFUNDS",
      "inflation": "FRED:T5YIE",
      "creditSpread": "FRED:BAMLH0A0HYM2",
      "ratePath": "FRED: DGS2 - FEDFUNDS",
      "vixTermStructure": "Yahoo: ^VIX3M / ^VIX",
      "creditSpreadMomentum": "Calculated: QoQ delta of BAMLH0A0HYM2"
    },
    "returnSources": {
      "cnStock": "ETF:ASHR",
      "hkStock": "ETF:MCHI",
      "usStock": "ETF:SPY",
      "devStock": "ETF:EFA",
      "emStock": "ETF:EEM",
      "bonds_us": "ETF:AGG",
      "bonds_china": "ETF:CBON",
      "bonds_global": "ETF:BNDX",
      "precious": "ETF:GLD",
      "energy": "ETF:XLE",
      "industrial": "ETF:COPX",
      "agriculture": "ETF:DBA",
      "crypto": "ETF:BTC-USD",
      "hedges": "ETF:SHV"
    }
  },
  "quarterly_2023_q3": {
    "period": "2023-Q3",
    "description": "连续季度数据 2023-Q3",
    "quality": "A",
    "macroData": {
      "usd": 106.17,
      "vix": 17.52,
      "cnPolicy": 0.3,
      "cnPolicyTrend": 0.0,
      "momentum": -0.5,
      "adoption": 0.6,
      "btcCycle": 0.3,
      "rateChangeReason": 0.0,
      "usdReason": 0.0,
      "vixReason": 0.0,
      "inflationReason": 0.0,
      "globalGrowth": 3.0,
      "growthTrend": 0.0,
      "inflationTrend": 0.0,
      "usdTrend": 0.0,
      "realYield": 2.45,
      "fedRate": 5.33,
      "inflation": 2.21,
      "creditSpread": 4.26,
      "ratePath": -0.3,
      "vixTermStructure": 1.055,
      "creditSpreadMomentum": 0.27
    },
    "actualReturns": {
      "cnStock": -0.0436,
      "hkStock": -0.0411,
      "usStock": -0.0311,
      "devStock": -0.0369,
      "emStock": -0.0426,
      "bonds_us": -0.0273,
      "bonds_china": -0.0001,
      "bonds_global": -0.01,
      "precious": -0.0478,
      "energy": 0.0855,
      "industrial": -0.0664,
      "agriculture": 0.0104,
      "crypto": -0.0834,
      "hedges": 0.0132
    },
    "dataSource": "FRED + Yahoo Finance (Auto)",
    "macroSources": {
      "usd": "Yahoo Finance",
      "vix": "Yahoo Finance",
      "realYield": "FRED:DFII10",
      "fedRate": "FRED:FEDFUNDS",
      "inflation": "FRED:T5YIE",
      "creditSpread": "FRED:BAMLH0A0HYM2",
      "cnPolicy": "Manual Override: 0.3",
      "ratePath": "FRED: DGS2 - FEDFUNDS",
      "vixTermStructure": "Yahoo: ^VIX3M / ^VIX",
      "creditSpreadMomentum": "Calculated: QoQ delta of BAMLH0A0HYM2"
    },
    "returnSources": {
      "cnStock": "ETF:ASHR",
      "hkStock": "ETF:MCHI",
      "usStock": "ETF:SPY",
      "devStock": "ETF:EFA",
      "emStock": "ETF:EEM",
      "bonds_us": "ETF:AGG",
      "bonds_china": "ETF:CBON",
      "bonds_global": "ETF:BNDX",
      "precious": "ETF:GLD",
      "energy": "ETF:XLE",
      "industrial": "ETF:COPX",
      "agriculture": "ETF:DBA",
      "crypto": "ETF:BTC-USD",
      "hedges": "ETF:SHV"
    }
  },
  "quarterly_2023_q4": {
    "period": "2023-Q4",
    "description": "连续季度数据 2023-Q4",
    "quality": "A",
    "macroData": {
      "usd": 101.33,
      "vix": 12.45,
      "cnPolicy": 0.0,
      "cnPolicyTrend": 0.0,
      "momentum": 0.8,
      "adoption": 0.6,
      "btcCycle": 0.3,
      "rateChangeReason": 0.0,
      "usdReason": 0.0,
      "vixReason": 0.0,
      "inflationReason": 0.0,
      "globalGrowth": 3.0,
      "growthTrend": 0.0,
      "inflationTrend": 0.0,
      "usdTrend": 0.0,
      "realYield": 1.71,
      "fedRate": 5.33,
      "inflation": 2.17,
      "creditSpread": 3.71,
      "ratePath": -0.93,
      "vixTermStructure": 1.162,
      "creditSpreadMomentum": -0.55
    },
    "actualReturns": {
      "cnStock": -0.083,
      "hkStock": -0.0631,
      "usStock": 0.0938,
      "devStock": 0.096,
      "emStock": 0.0623,
      "bonds_us": 0.068,
      "bonds_china": 0.0344,
      "bonds_global": 0.0619,
      "precious": 0.1158,
      "energy": -0.0028,
      "industrial": 0.0602,
      "agriculture": -0.0027,
      "crypto": 0.5803,
      "hedges": 0.0137
    },
    "dataSource": "FRED + Yahoo Finance (Auto)",
    "macroSources": {
      "usd": "Yahoo Finance",
      "vix": "Yahoo Finance",
      "realYield": "FRED:DFII10",
      "fedRate": "FRED:FEDFUNDS",
      "inflation": "FRED:T5YIE",
      "creditSpread": "FRED:BAMLH0A0HYM2",
      "ratePath": "FRED: DGS2 - FEDFUNDS",
      "vixTermStructure": "Yahoo: ^VIX3M / ^VIX",
      "creditSpreadMomentum": "Calculated: QoQ delta of BAMLH0A0HYM2"
    },
    "returnSources": {
      "cnStock": "ETF:ASHR",
      "hkStock": "ETF:MCHI",
      "usStock": "ETF:SPY",
      "devStock": "ETF:EFA",
      "emStock": "ETF:EEM",
      "bonds_us": "ETF:AGG",
      "bonds_china": "ETF:CBON",
      "bonds_global": "ETF:BNDX",
      "precious": "ETF:GLD",
      "energy": "ETF:XLE",
      "industrial": "ETF:COPX",
      "agriculture": "ETF:DBA",
      "crypto": "ETF:BTC-USD",
      "hedges": "ETF:SHV"
    }
  },
  "quarterly_2024_q1": {
    "period": "2024-Q1",
    "description": "连续季度数据 2024-Q1",
    "quality": "A",
    "macroData": {
      "usd": 104.55,
      "vix": 13.01,
      "cnPolicy": 0.4,
      "cnPolicyTrend": 0.0,
      "momentum": 0.8,
      "adoption": 0.7,
      "btcCycle": 0.5,
      "rateChangeReason": 0.0,
      "usdReason": 0.0,
      "vixReason": 0.0,
      "inflationReason": 0.0,
      "globalGrowth": 3.0,
      "growthTrend": 0.0,
      "inflationTrend": 0.0,
      "usdTrend": 0.0,
      "realYield": 2.0,
      "fedRate": 5.33,
      "inflation": 2.43,
      "creditSpread": 3.23,
      "ratePath": -0.6,
      "vixTermStructure": 1.072,
      "creditSpreadMomentum": -0.48
    },
    "actualReturns": {
      "cnStock": 0.059,
      "hkStock": 0.0132,
      "usStock": 0.1114,
      "devStock": 0.0647,
      "emStock": 0.0459,
      "bonds_us": -0.0067,
      "bonds_china": -0.0002,
      "bonds_global": 0.0058,
      "precious": 0.1362,
      "energy": 0.1676,
      "industrial": 0.2104,
      "agriculture": 0.2187,
      "crypto": 0.5421,
      "hedges": 0.0126
    },
    "dataSource": "FRED + Yahoo Finance (Auto)",
    "macroSources": {
      "usd": "Yahoo Finance",
      "vix": "Yahoo Finance",
      "realYield": "FRED:DFII10",
      "fedRate": "FRED:FEDFUNDS",
      "inflation": "FRED:T5YIE",
      "creditSpread": "FRED:BAMLH0A0HYM2",
      "cnPolicy": "Manual Override: 0.4",
      "ratePath": "FRED: DGS2 - FEDFUNDS",
      "vixTermStructure": "Yahoo: ^VIX3M / ^VIX",
      "creditSpreadMomentum": "Calculated: QoQ delta of BAMLH0A0HYM2"
    },
    "returnSources": {
      "cnStock": "ETF:ASHR",
      "hkStock": "ETF:MCHI",
      "usStock": "ETF:SPY",
      "devStock": "ETF:EFA",
      "emStock": "ETF:EEM",
      "bonds_us": "ETF:AGG",
      "bonds_china": "ETF:CBON",
      "bonds_global": "ETF:BNDX",
      "precious": "ETF:GLD",
      "energy": "ETF:XLE",
      "industrial": "ETF:COPX",
      "agriculture": "ETF:DBA",
      "crypto": "ETF:BTC-USD",
      "hedges": "ETF:SHV"
    }
  },
  "quarterly_2024_q2": {
    "period": "2024-Q2",
    "description": "连续季度数据 2024-Q2",
    "quality": "A",
    "macroData": {
      "usd": 105.87,
      "vix": 12.44,
      "cnPolicy": 0.0,
      "cnPolicyTrend": 0.0,
      "momentum": 0.5,
      "adoption": 0.7,
      "btcCycle": 0.5,
      "rateChangeReason": 0.0,
      "usdReason": 0.0,
      "vixReason": 0.0,
      "inflationReason": 0.0,
      "globalGrowth": 3.0,
      "growthTrend": 0.0,
      "inflationTrend": 0.0,
      "usdTrend": 0.0,
      "realYield": 2.09,
      "fedRate": 5.33,
      "inflation": 2.23,
      "creditSpread": 3.25,
      "ratePath": -0.73,
      "vixTermStructure": 1.15,
      "creditSpreadMomentum": 0.02
    },
    "actualReturns": {
      "cnStock": -0.0414,
      "hkStock": 0.0735,
      "usStock": 0.0733,
      "devStock": 0.0319,
      "emStock": 0.065,
      "bonds_us": 0.0188,
      "bonds_china": 0.006,
      "bonds_global": 0.0023,
      "precious": 0.0269,
      "energy": -0.074,
      "industrial": 0.0801,
      "agriculture": -0.0355,
      "crypto": -0.1776,
      "hedges": 0.0125
    },
    "dataSource": "FRED + Yahoo Finance (Auto)",
    "macroSources": {
      "usd": "Yahoo Finance",
      "vix": "Yahoo Finance",
      "realYield": "FRED:DFII10",
      "fedRate": "FRED:FEDFUNDS",
      "inflation": "FRED:T5YIE",
      "creditSpread": "FRED:BAMLH0A0HYM2",
      "ratePath": "FRED: DGS2 - FEDFUNDS",
      "vixTermStructure": "Yahoo: ^VIX3M / ^VIX",
      "creditSpreadMomentum": "Calculated: QoQ delta of BAMLH0A0HYM2"
    },
    "returnSources": {
      "cnStock": "ETF:ASHR",
      "hkStock": "ETF:MCHI",
      "usStock": "ETF:SPY",
      "devStock": "ETF:EFA",
      "emStock": "ETF:EEM",
      "bonds_us": "ETF:AGG",
      "bonds_china": "ETF:CBON",
      "bonds_global": "ETF:BNDX",
      "precious": "ETF:GLD",
      "energy": "ETF:XLE",
      "industrial": "ETF:COPX",
      "agriculture": "ETF:DBA",
      "crypto": "ETF:BTC-USD",
      "hedges": "ETF:SHV"
    }
  },
  "quarterly_2024_q3": {
    "period": "2024-Q3",
    "description": "连续季度数据 2024-Q3",
    "quality": "A",
    "macroData": {
      "usd": 100.78,
      "vix": 16.73,
      "cnPolicy": 0.8,
      "cnPolicyTrend": 0.0,
      "momentum": 0.5,
      "adoption": 0.7,
      "btcCycle": 0.5,
      "rateChangeReason": 0.0,
      "usdReason": 0.0,
      "vixReason": 0.0,
      "inflationReason": 0.0,
      "globalGrowth": 3.0,
      "growthTrend": 0.0,
      "inflationTrend": 0.0,
      "usdTrend": 0.0,
      "realYield": 1.64,
      "fedRate": 4.83,
      "inflation": 2.11,
      "creditSpread": 3.04,
      "ratePath": -0.9,
      "vixTermStructure": 1.075,
      "creditSpreadMomentum": -0.21
    },
    "actualReturns": {
      "cnStock": 0.4032,
      "hkStock": 0.3349,
      "usStock": 0.0362,
      "devStock": 0.0307,
      "emStock": 0.0766,
      "bonds_us": 0.0339,
      "bonds_china": 0.0304,
      "bonds_global": 0.0324,
      "precious": 0.1089,
      "energy": 0.0427,
      "industrial": -0.006,
      "agriculture": 0.0496,
      "crypto": 0.0649,
      "hedges": 0.0138
    },
    "dataSource": "FRED + Yahoo Finance (Auto)",
    "macroSources": {
      "usd": "Yahoo Finance",
      "vix": "Yahoo Finance",
      "realYield": "FRED:DFII10",
      "fedRate": "FRED:FEDFUNDS",
      "inflation": "FRED:T5YIE",
      "creditSpread": "FRED:BAMLH0A0HYM2",
      "cnPolicy": "Manual Override: 0.8",
      "ratePath": "FRED: DGS2 - FEDFUNDS",
      "vixTermStructure": "Yahoo: ^VIX3M / ^VIX",
      "creditSpreadMomentum": "Calculated: QoQ delta of BAMLH0A0HYM2"
    },
    "returnSources": {
      "cnStock": "ETF:ASHR",
      "hkStock": "ETF:MCHI",
      "usStock": "ETF:SPY",
      "devStock": "ETF:EFA",
      "emStock": "ETF:EEM",
      "bonds_us": "ETF:AGG",
      "bonds_china": "ETF:CBON",
      "bonds_global": "ETF:BNDX",
      "precious": "ETF:GLD",
      "energy": "ETF:XLE",
      "industrial": "ETF:COPX",
      "agriculture": "ETF:DBA",
      "crypto": "ETF:BTC-USD",
      "hedges": "ETF:SHV"
    }
  },
  "quarterly_2024_q4": {
    "period": "2024-Q4",
    "description": "连续季度数据 2024-Q4",
    "quality": "A",
    "macroData": {
      "usd": 108.49,
      "vix": 17.35,
      "cnPolicy": 0.0,
      "cnPolicyTrend": 0.0,
      "momentum": 0.5,
      "adoption": 0.7,
      "btcCycle": 0.5,
      "rateChangeReason": 0.0,
      "usdReason": 0.0,
      "vixReason": 0.0,
      "inflationReason": 0.0,
      "globalGrowth": 3.0,
      "growthTrend": 0.0,
      "inflationTrend": 0.0,
      "usdTrend": 0.0,
      "realYield": 2.26,
      "fedRate": 4.33,
      "inflation": 2.4,
      "creditSpread": 2.81,
      "ratePath": -0.05,
      "vixTermStructure": 1.125,
      "creditSpreadMomentum": -0.23
    },
    "actualReturns": {
      "cnStock": -0.2168,
      "hkStock": -0.1706,
      "usStock": 0.0366,
      "devStock": -0.0707,
      "emStock": -0.0875,
      "bonds_us": -0.0222,
      "bonds_china": -0.0157,
      "bonds_global": 0.0026,
      "precious": -0.0062,
      "energy": -0.0534,
      "industrial": -0.1731,
      "agriculture": 0.086,
      "crypto": 0.5651,
      "hedges": 0.0112
    },
    "dataSource": "FRED + Yahoo Finance (Auto)",
    "macroSources": {
      "usd": "Yahoo Finance",
      "vix": "Yahoo Finance",
      "realYield": "FRED:DFII10",
      "fedRate": "FRED:FEDFUNDS",
      "inflation": "FRED:T5YIE",
      "creditSpread": "FRED:BAMLH0A0HYM2",
      "ratePath": "FRED: DGS2 - FEDFUNDS",
      "vixTermStructure": "Yahoo: ^VIX3M / ^VIX",
      "creditSpreadMomentum": "Calculated: QoQ delta of BAMLH0A0HYM2"
    },
    "returnSources": {
      "cnStock": "ETF:ASHR",
      "hkStock": "ETF:MCHI",
      "usStock": "ETF:SPY",
      "devStock": "ETF:EFA",
      "emStock": "ETF:EEM",
      "bonds_us": "ETF:AGG",
      "bonds_china": "ETF:CBON",
      "bonds_global": "ETF:BNDX",
      "precious": "ETF:GLD",
      "energy": "ETF:XLE",
      "industrial": "ETF:COPX",
      "agriculture": "ETF:DBA",
      "crypto": "ETF:BTC-USD",
      "hedges": "ETF:SHV"
    }
  },
  "quarterly_2025_q1": {
    "period": "2025-Q1",
    "description": "连续季度数据 2025-Q1",
    "quality": "A",
    "macroData": {
      "usd": 104.21,
      "vix": 22.28,
      "cnPolicy": 0.0,
      "cnPolicyTrend": 0.0,
      "momentum": -0.8,
      "adoption": 0.7,
      "btcCycle": 0.75,
      "rateChangeReason": 0.0,
      "usdReason": 0.0,
      "vixReason": 0.0,
      "inflationReason": 0.0,
      "globalGrowth": 3.0,
      "growthTrend": 0.0,
      "inflationTrend": 0.0,
      "usdTrend": 0.0,
      "realYield": 1.78,
      "fedRate": 4.33,
      "inflation": 2.5,
      "creditSpread": 4.01,
      "ratePath": -0.65,
      "vixTermStructure": 0.81,
      "creditSpreadMomentum": 1.2
    },
    "actualReturns": {
      "cnStock": -0.0087,
      "hkStock": 0.096,
      "usStock": -0.1488,
      "devStock": -0.0181,
      "emStock": -0.0407,
      "bonds_us": 0.0384,
      "bonds_china": 0.0049,
      "bonds_global": 0.0087,
      "precious": 0.1502,
      "energy": -0.0884,
      "industrial": -0.1742,
      "agriculture": -0.011,
      "crypto": -0.182,
      "hedges": 0.0103
    },
    "dataSource": "FRED + Yahoo Finance (Auto)",
    "macroSources": {
      "usd": "Yahoo Finance",
      "vix": "Yahoo Finance",
      "realYield": "FRED:DFII10",
      "fedRate": "FRED:FEDFUNDS",
      "inflation": "FRED:T5YIE",
      "creditSpread": "FRED:BAMLH0A0HYM2",
      "ratePath": "FRED: DGS2 - FEDFUNDS",
      "vixTermStructure": "Yahoo: ^VIX3M / ^VIX",
      "creditSpreadMomentum": "Calculated: QoQ delta of BAMLH0A0HYM2"
    },
    "returnSources": {
      "cnStock": "ETF:ASHR",
      "hkStock": "ETF:MCHI",
      "usStock": "ETF:SPY",
      "devStock": "ETF:EFA",
      "emStock": "ETF:EEM",
      "bonds_us": "ETF:AGG",
      "bonds_china": "ETF:CBON",
      "bonds_global": "ETF:BNDX",
      "precious": "ETF:GLD",
      "energy": "ETF:XLE",
      "industrial": "ETF:COPX",
      "agriculture": "ETF:DBA",
      "crypto": "ETF:BTC-USD",
      "hedges": "ETF:SHV"
    }
  },
  "quarterly_2025_q2": {
    "period": "2025-Q2",
    "description": "连续季度数据 2025-Q2",
    "quality": "A",
    "macroData": {
      "usd": 96.88,
      "vix": 16.73,
      "cnPolicy": 0.0,
      "cnPolicyTrend": 0.0,
      "momentum": 0.8,
      "adoption": 0.7,
      "btcCycle": 0.75,
      "rateChangeReason": 0.0,
      "usdReason": 0.0,
      "vixReason": 0.0,
      "inflationReason": 0.0,
      "globalGrowth": 3.0,
      "growthTrend": 0.0,
      "inflationTrend": 0.0,
      "usdTrend": 0.0,
      "realYield": 2.02,
      "fedRate": 4.33,
      "inflation": 2.37,
      "creditSpread": 2.8,
      "ratePath": NaN,
      "vixTermStructure": 1.173,
      "creditSpreadMomentum": -1.21
    },
    "actualReturns": {
      "cnStock": 0.1004,
      "hkStock": 0.1052,
      "usStock": 0.2413,
      "devStock": 0.2139,
      "emStock": 0.2132,
      "bonds_us": -0.0002,
      "bonds_china": 0.0228,
      "bonds_global": 0.0123,
      "precious": 0.098,
      "energy": 0.114,
      "industrial": 0.4299,
      "agriculture": -0.0096,
      "crypto": 0.3838,
      "hedges": 0.0098
    },
    "dataSource": "FRED + Yahoo Finance (Auto)",
    "macroSources": {
      "usd": "Yahoo Finance",
      "vix": "Yahoo Finance",
      "realYield": "FRED:DFII10",
      "fedRate": "FRED:FEDFUNDS",
      "inflation": "FRED:T5YIE",
      "creditSpread": "FRED:BAMLH0A0HYM2",
      "ratePath": "FRED: DGS2 - FEDFUNDS",
      "vixTermStructure": "Yahoo: ^VIX3M / ^VIX",
      "creditSpreadMomentum": "Calculated: QoQ delta of BAMLH0A0HYM2"
    },
    "returnSources": {
      "cnStock": "ETF:ASHR",
      "hkStock": "ETF:MCHI",
      "usStock": "ETF:SPY",
      "devStock": "ETF:EFA",
      "emStock": "ETF:EEM",
      "bonds_us": "ETF:AGG",
      "bonds_china": "ETF:CBON",
      "bonds_global": "ETF:BNDX",
      "precious": "ETF:GLD",
      "energy": "ETF:XLE",
      "industrial": "ETF:COPX",
      "agriculture": "ETF:DBA",
      "crypto": "ETF:BTC-USD",
      "hedges": "ETF:SHV"
    }
  },
  "quarterly_2025_q3": {
    "period": "2025-Q3",
    "description": "连续季度数据 2025-Q3",
    "quality": "A",
    "macroData": {
      "usd": 97.77,
      "vix": 16.28,
      "cnPolicy": 0.0,
      "cnPolicyTrend": 0.0,
      "momentum": 0.5,
      "adoption": 0.7,
      "btcCycle": 0.75,
      "rateChangeReason": 0.0,
      "usdReason": 0.0,
      "vixReason": 0.0,
      "inflationReason": 0.0,
      "globalGrowth": 3.0,
      "growthTrend": 0.0,
      "inflationTrend": 0.0,
      "usdTrend": 0.0,
      "realYield": 1.8,
      "fedRate": 4.09,
      "inflation": 2.38,
      "creditSpread": 2.8,
      "ratePath": -0.51,
      "vixTermStructure": 1.146,
      "creditSpreadMomentum": 0.0
    },
    "actualReturns": {
      "cnStock": 0.1878,
      "hkStock": 0.2162,
      "usStock": 0.0731,
      "devStock": 0.0621,
      "emStock": 0.1122,
      "bonds_us": 0.0275,
      "bonds_china": 0.0019,
      "bonds_global": 0.0073,
      "precious": 0.1644,
      "energy": 0.0303,
      "industrial": 0.3338,
      "agriculture": 0.0301,
      "crypto": 0.1307,
      "hedges": 0.0112
    },
    "dataSource": "FRED + Yahoo Finance (Auto)",
    "macroSources": {
      "usd": "Yahoo Finance",
      "vix": "Yahoo Finance",
      "realYield": "FRED:DFII10",
      "fedRate": "FRED:FEDFUNDS",
      "inflation": "FRED:T5YIE",
      "creditSpread": "FRED:BAMLH0A0HYM2",
      "ratePath": "FRED: DGS2 - FEDFUNDS",
      "vixTermStructure": "Yahoo: ^VIX3M / ^VIX",
      "creditSpreadMomentum": "Calculated: QoQ delta of BAMLH0A0HYM2"
    },
    "returnSources": {
      "cnStock": "ETF:ASHR",
      "hkStock": "ETF:MCHI",
      "usStock": "ETF:SPY",
      "devStock": "ETF:EFA",
      "emStock": "ETF:EEM",
      "bonds_us": "ETF:AGG",
      "bonds_china": "ETF:CBON",
      "bonds_global": "ETF:BNDX",
      "precious": "ETF:GLD",
      "energy": "ETF:XLE",
      "industrial": "ETF:COPX",
      "agriculture": "ETF:DBA",
      "crypto": "ETF:BTC-USD",
      "hedges": "ETF:SHV"
    }
  },
  "quarterly_2025_q4": {
    "period": "2025-Q4",
    "description": "连续季度数据 2025-Q4",
    "quality": "A",
    "macroData": {
      "usd": 98.28,
      "vix": 14.95,
      "cnPolicy": 0.0,
      "cnPolicyTrend": 0.0,
      "momentum": 0.0,
      "adoption": 0.7,
      "btcCycle": 0.75,
      "rateChangeReason": 0.0,
      "usdReason": 0.0,
      "vixReason": 0.0,
      "inflationReason": 0.0,
      "globalGrowth": 3.0,
      "growthTrend": 0.0,
      "inflationTrend": 0.0,
      "usdTrend": 0.0,
      "realYield": 1.94,
      "fedRate": 3.64,
      "inflation": 2.28,
      "creditSpread": 2.83,
      "ratePath": -0.18,
      "vixTermStructure": 1.216,
      "creditSpreadMomentum": 0.03
    },
    "actualReturns": {
      "cnStock": 0.0453,
      "hkStock": -0.0481,
      "usStock": 0.027,
      "devStock": 0.0486,
      "emStock": 0.0586,
      "bonds_us": 0.0107,
      "bonds_china": 0.0314,
      "bonds_global": 0.0053,
      "precious": 0.1218,
      "energy": 0.0585,
      "industrial": 0.272,
      "agriculture": 0.0004,
      "crypto": -0.2474,
      "hedges": 0.0098
    },
    "dataSource": "FRED + Yahoo Finance (Auto)",
    "macroSources": {
      "usd": "Yahoo Finance",
      "vix": "Yahoo Finance",
      "realYield": "FRED:DFII10",
      "fedRate": "FRED:FEDFUNDS",
      "inflation": "FRED:T5YIE",
      "creditSpread": "FRED:BAMLH0A0HYM2",
      "ratePath": "FRED: DGS2 - FEDFUNDS",
      "vixTermStructure": "Yahoo: ^VIX3M / ^VIX",
      "creditSpreadMomentum": "Calculated: QoQ delta of BAMLH0A0HYM2"
    },
    "returnSources": {
      "cnStock": "ETF:ASHR",
      "hkStock": "ETF:MCHI",
      "usStock": "ETF:SPY",
      "devStock": "ETF:EFA",
      "emStock": "ETF:EEM",
      "bonds_us": "ETF:AGG",
      "bonds_china": "ETF:CBON",
      "bonds_global": "ETF:BNDX",
      "precious": "ETF:GLD",
      "energy": "ETF:XLE",
      "industrial": "ETF:COPX",
      "agriculture": "ETF:DBA",
      "crypto": "ETF:BTC-USD",
      "hedges": "ETF:SHV"
    }
  }
};
window.historicalSnapshots = historicalSnapshots;

// ==========================================
// Custom Scenario Injection (Runtime)
// ==========================================
// Allows adding new scenarios without editing source files.
// Store JSON in localStorage key: historicalSnapshots_custom
window.loadCustomHistoricalSnapshots = function (custom) {
    try {
        if (!custom || typeof custom !== 'object') return;
        let added = 0;
        Object.entries(custom).forEach(([key, val]) => {
            if (!val || typeof val !== 'object') return;
            const macro = val.macro || val.macroData;
            const actualReturns = val.actualReturns;
            if (!macro || typeof macro !== 'object') return;
            if (!actualReturns || typeof actualReturns !== 'object') return;

            const period = val.period || key;
            const yMatch = String(period).match(/(\d{4})/);
            const inferredYear = yMatch ? parseInt(yMatch[1], 10) : 0;
            if (!inferredYear || inferredYear < 1900 || inferredYear > 2100) return;

            const normalized = {
                ...val,
                period,
                year: Number(val.year) || inferredYear,
                macroData: val.macroData || val.macro || {},
                macro: val.macro || val.macroData || {},
                actualReturns
            };
            window.historicalSnapshots[key] = normalized;
            if (window.snapshotYears) {
                window.snapshotYears[key] = normalized.year;
            }
            added += 1;
        });
        if (added > 0) console.log(`[CustomScenarios] Loaded ${added} custom scenarios.`);
    } catch (e) {
        console.warn('[CustomScenarios] Load failed:', e);
    }
};
// Expose for runtime and offline tools
window.assetLibrary = assetLibrary;

try {
    if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem('historicalSnapshots_custom');
        if (raw) {
            const custom = JSON.parse(raw);
            window.loadCustomHistoricalSnapshots(custom);
        }
    }
} catch (e) {
    console.warn('[CustomScenarios] localStorage parse failed:', e);
}

window.exportHistoricalSnapshots = function () {
    try {
        const payload = {
            version: 'v1',
            generatedAt: new Date().toISOString(),
            scenarios: window.historicalSnapshots || {}
        };
        const json = JSON.stringify(payload, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `historical_snapshots_${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(a.href);
        return payload;
    } catch (e) {
        console.warn('[CustomScenarios] export failed:', e);
        return null;
    }
};

// ==========================================
// v16.19 Sub-Asset Sensitivity Overrides
// ==========================================
// 用于细化子资产对宏观因子的敏感度差异
// ==========================================
// v16.20 Sub-Asset Sensitivity Matrix (First Principles)
// ==========================================
window.subCategorySensOverrides = {
    // --- US Sectors (SPX) ---
    // Energy: Inflation Hedge, Strong USD headwind
    'ENERGY': { 'inflation': 1.0, 'globalGrowth': 1.2, 'usd': -0.8, 'fedRate': -0.2 },
    // Financials: Rate beneficiary (NIM), Credit risk sensitive
    'FINANCE': { 'fedRate': 0.5, 'creditSpread': -1.2, 'globalGrowth': 0.8 },
    // Tech: Duration sensitive, Adoption driven
    'TECH': { 'fedRate': -1.2, 'adoption': 1.0, 'globalGrowth': 0.7 },
    'NDX': { 'fedRate': -1.2, 'adoption': 0.9, 'globalGrowth': 0.6 },
    // AI: Hyper-growth, high duration
    'AI500': { 'fedRate': -1.3, 'adoption': 1.3, 'momentum': 0.8 },
    // Staples/Healthcare: Defensives (Bond Proxies)
    'XLP': { 'globalGrowth': 0.3, 'fedRate': -0.4, 'inflation': 0.6 }, // Cost pass-through
    'XLV': { 'globalGrowth': 0.4, 'fedRate': -0.3 },
    // Cyclicals
    'XLY': { 'globalGrowth': 1.3, 'inflation': -0.5, 'fedRate': -0.9 }, // Consumer Discretionary
    'XLI': { 'globalGrowth': 1.2, 'pmiDelta': 1.0 }, // Industrial
    'XLB': { 'globalGrowth': 1.2, 'inflation': 0.7 }, // Materials

    // --- CN Assets ---
    'TECH100': { 'fedRate': -0.8, 'cnPolicy': 1.5, 'adoption': 0.8 },
    'HKSTOCKS': { 'fedRate': -0.7, 'usd': -0.9 },
    'CONSUMER': { 'cnPolicy': 0.8, 'inflation': -0.3 }, // Domestic demand
    'Kiwi': { 'globalGrowth': 0.9, 'usd': -0.6 }, // Wait, Kiwi is FX? Assuming equity sector here or placeholder

    // --- Developed Markets ---
    'N225': { 'usd': 0.8, 'globalGrowth': 1.1 }, // Weak Yen (Strong USD) helps exporters
    'STOXX': { 'globalGrowth': 1.0, 'usd': -0.4 },
    'TSX': { 'globalGrowth': 1.0, 'inflation': 0.6, 'usd': -0.5 }, // Resource heavy
    'ASX': { 'globalGrowth': 1.1, 'inflation': 0.7, 'usd': -0.7 }, // Resource heavy

    // --- Emerging Markets ---
    'SENSEX': { 'globalGrowth': 1.2, 'usd': -0.5, 'fedRate': -0.4 },
    'BVSP': { 'inflation': 0.8, 'usd': -0.7, 'globalGrowth': 1.2 }, // Brazil Commodity

    // --- Commodities ---
    'SI': { 'inflation': 0.8, 'globalGrowth': 1.0, 'usd': -0.8 }, // Silver
    'COPPER': { 'globalGrowth': 1.5, 'inflation': 0.8 }, // Dr Copper
    'CORN': { 'usd': -0.9, 'inflation': 0.6, 'fedRate': -0.2 }, // Ags
    'WHEAT': { 'usd': -0.9, 'inflation': 0.6 },
    'SOYB': { 'usd': -0.9, 'inflation': 0.6 },
    'OIL': { 'globalGrowth': 1.1, 'usd': -0.9, 'geopolitics': 1.0 }, // If geopo exists

    // --- Bonds ---
    'HYG': { 'fedRate': -0.4, 'creditSpread': -2.0, 'globalGrowth': 0.5 }, // Equity-like credit
    'LQD': { 'fedRate': -0.8, 'creditSpread': -1.0 }
};

// ============================================================================
// v16.44.3: 基准标的一致性校验 (Benchmark Consistency Validator)
// ============================================================================
// 设计原则:
//   每个资产类必须且仅有一个 benchmarkTicker（唯一事实源）。
//   该 Ticker 同时服务于: (1)回测数据 (2)BL协方差计算 (3)前端展示。
//   此函数在系统启动时自动执行，任何偏离都会在console中发出红色警告。
// ============================================================================

(function validateBenchmarkConsistency() {
    if (typeof assetLibrary === 'undefined') return;

    const issues = [];
    const benchmarkTable = {};

    Object.keys(assetLibrary).forEach(key => {
        const asset = assetLibrary[key];
        const bt = asset.benchmarkTicker;

        // 检查1: benchmarkTicker 是否存在
        if (bt === undefined) {
            issues.push(`❌ ${key}: 缺少 benchmarkTicker 字段`);
            return;
        }

        // null 表示无可用ETF（如 forex_cny），合法
        if (bt === null) {
            benchmarkTable[key] = '(无ETF)';
            return;
        }

        benchmarkTable[key] = bt;

        // 检查2: benchmarkTicker 是否在 etfMap 的可选列表中
        const etfMap = asset.etfMap;
        if (etfMap) {
            const allTickers = [];
            Object.values(etfMap).forEach(val => {
                if (Array.isArray(val)) {
                    val.forEach(e => { if (e.ticker) allTickers.push(e.ticker); });
                }
            });
            if (allTickers.length > 0 && !allTickers.includes(bt)) {
                issues.push(`⚠️ ${key}: benchmarkTicker "${bt}" 不在 etfMap 列表 [${allTickers.join(',')}] 中`);
            }
        }
    });

    // 检查3: 与 BL_ASSET_MAP 的覆盖性（如果 BL 模块已加载）
    if (typeof window !== 'undefined' && window.BL_ASSET_MAP) {
        Object.keys(window.BL_ASSET_MAP).forEach(blKey => {
            const systemKeys = window.BL_ASSET_MAP[blKey];
            systemKeys.forEach(sysKey => {
                if (!assetLibrary[sysKey]) {
                    issues.push(`⚠️ BL_ASSET_MAP.${blKey} 引用了不存在的系统键 "${sysKey}"`);
                }
            });
        });
    }

    // 输出结果
    if (issues.length === 0) {
        console.log('%c [Data Integrity] ✅ 基准标的一致性校验通过 (17 类资产)', 'color: green; font-weight: bold');
    } else {
        console.warn('%c [Data Integrity] ⚠️ 发现 ' + issues.length + ' 个一致性问题:', 'color: red; font-weight: bold; font-size: 14px');
        issues.forEach(i => console.warn('  ' + i));
    }

    // 打印基准对照表（供开发者快速查阅）
    console.table(benchmarkTable);
})();
