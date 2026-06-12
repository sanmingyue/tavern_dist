import { z } from 'zod';

/**
 * 小手机数据结构定义
 * 所有APP数据都存储在这里
 */

// 设备信息
const DeviceSchema = z.object({
  id: z.string(),
  name: z.string(),
  owner: z.string(),
});

// 联系人
const ContactSchema = z.object({
  name: z.string(),
  avatar: z.string().optional(),
  alias: z.string().optional(),
  addedAt: z.number(),
  tags: z.array(z.string()).default([]),
  phone: z.string().optional(),
  blocked: z.boolean().optional(),
  blockedAt: z.number().optional(),
  blockReason: z.string().optional(),
});

// 消息
const MessageSchema = z.object({
  id: z.string(),
  from: z.string(),
  to: z.string(),
  content: z.string(),
  timestamp: z.number(),
  type: z.enum(['text', 'image', 'voice', 'sticker', 'flash_photo']).default('text'),
  read: z.boolean().default(false),
});

// 对话
const ConversationSchema = z.record(
  z.string(),
  z.object({
    messages: z.array(MessageSchema),
    lastUpdate: z.number(),
    unread: z.number().default(0),
  }),
);

// 通讯录
const ContactsSchema = z.record(z.string(), ContactSchema);

// 钱包
const WalletSchema = z.object({
  balance: z.number().default(0),
  cards: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        bank: z.string(),
        last4: z.string(),
      }),
    )
    .default([]),
  transactions: z
    .array(
      z.object({
        id: z.string(),
        type: z.enum(['income', 'expense']),
        amount: z.number(),
        description: z.string(),
        timestamp: z.number(),
      }),
    )
    .default([]),
});

// 音乐
const MusicSchema = z.object({
  playlist: z
    .array(
      z.object({
        id: z.string(),
        title: z.string(),
        artist: z.string(),
        album: z.string().optional(),
        duration: z.number(),
        cover: z.string().optional(),
        url: z.string(),
      }),
    )
    .default([]),
  favorites: z.array(z.string()).default([]),
  recent: z.array(z.string()).default([]),
  lastPlayed: z.string().optional(),
  currentTime: z.number().default(0),
  playing: z.boolean().default(false),
});

// 视频
const VideoSchema = z.object({
  playlist: z
    .array(
      z.object({
        id: z.string(),
        title: z.string(),
        cover: z.string(),
        url: z.string(),
        duration: z.number(),
      }),
    )
    .default([]),
  favorites: z.array(z.string()).default([]),
  watchHistory: z
    .array(
      z.object({
        id: z.string(),
        progress: z.number(),
        lastWatch: z.number(),
      }),
    )
    .default([]),
});

// 购物
const ShopSchema = z.object({
  cart: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        price: z.number(),
        quantity: z.number(),
        cover: z.string().optional(),
      }),
    )
    .default([]),
  orders: z
    .array(
      z.object({
        id: z.string(),
        items: z.array(
          z.object({
            id: z.string(),
            name: z.string(),
            price: z.number(),
            quantity: z.number(),
          }),
        ),
        total: z.number(),
        status: z.enum(['pending', 'paid', 'shipped', 'delivered', 'cancelled']),
        createTime: z.number(),
      }),
    )
    .default([]),
  favorites: z.array(z.string()).default([]),
});

// 地图
const MapSchema = z.object({
  currentLocation: z
    .object({
      name: z.string(),
      lat: z.number().optional(),
      lng: z.number().optional(),
    })
    .optional(),
  favoritePlaces: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        address: z.string(),
        category: z.string(),
      }),
    )
    .default([]),
  history: z
    .array(
      z.object({
        name: z.string(),
        timestamp: z.number(),
      }),
    )
    .default([]),
});

// 日历
const CalendarSchema = z.object({
  events: z
    .array(
      z.object({
        id: z.string(),
        title: z.string(),
        description: z.string().optional(),
        startTime: z.number(),
        endTime: z.number().optional(),
        allDay: z.boolean().default(false),
        reminder: z.number().optional(),
      }),
    )
    .default([]),
});

// 备忘录
const NotesSchema = z.object({
  items: z
    .array(
      z.object({
        id: z.string(),
        title: z.string(),
        content: z.string(),
        createTime: z.number(),
        updateTime: z.number(),
        color: z.string().optional(),
      }),
    )
    .default([]),
});

// 相册
const GallerySchema = z.object({
  albums: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        cover: z.string().optional(),
        photos: z
          .array(
            z.object({
              id: z.string(),
              url: z.string(),
              thumbnail: z.string().optional(),
              createTime: z.number(),
              description: z.string().optional(),
            }),
          )
          .default([]),
      }),
    )
    .default([]),
});

// 论坛
const ForumSchema = z.object({
  posts: z
    .array(
      z.object({
        id: z.string(),
        title: z.string(),
        author: z.string(),
        content: z.string(),
        createTime: z.number(),
        likes: z.number().default(0),
        comments: z.number().default(0),
        category: z.string(),
      }),
    )
    .default([]),
  myPosts: z.array(z.string()).default([]),
  favorites: z.array(z.string()).default([]),
});

// 外卖
const DeliverySchema = z.object({
  addresses: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        phone: z.string(),
        address: z.string(),
        isDefault: z.boolean().default(false),
      }),
    )
    .default([]),
  orders: z
    .array(
      z.object({
        id: z.string(),
        restaurant: z.string(),
        items: z.array(
          z.object({
            id: z.string(),
            name: z.string(),
            price: z.number(),
            quantity: z.number(),
          }),
        ),
        total: z.number(),
        status: z.enum(['pending', 'paid', 'preparing', 'delivering', 'delivered', 'cancelled']),
        createTime: z.number(),
      }),
    )
    .default([]),
  favorites: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        cover: z.string(),
      }),
    )
    .default([]),
});

// 打车
const TaxiSchema = z.object({
  addresses: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        address: z.string(),
      }),
    )
    .default([]),
  orders: z
    .array(
      z.object({
        id: z.string(),
        from: z.string(),
        to: z.string(),
        price: z.number(),
        status: z.enum(['pending', 'matching', 'driving', 'arrived', 'completed', 'cancelled']),
        createTime: z.number(),
      }),
    )
    .default([]),
});

// 电影
const MovieSchema = z.object({
  tickets: z
    .array(
      z.object({
        id: z.string(),
        movie: z.string(),
        cinema: z.string(),
        time: z.number(),
        seats: z.array(z.string()),
        price: z.number(),
      }),
    )
    .default([]),
  favorites: z.array(z.string()).default([]),
});

// 电话/短信
const CallLogSchema = z.object({
  logs: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        number: z.string(),
        type: z.enum(['incoming', 'outgoing', 'missed']),
        duration: z.number().optional(),
        timestamp: z.number(),
      }),
    )
    .default([]),
});

const SMSSchema = z.object({
  threads: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        number: z.string(),
        messages: z
          .array(
            z.object({
              id: z.string(),
              content: z.string(),
              from: z.string(),
              timestamp: z.number(),
              read: z.boolean().default(false),
            }),
          )
          .default([]),
        lastUpdate: z.number(),
        unread: z.number().default(0),
      }),
    )
    .default([]),
});

// 时钟/闹钟
const ClockSchema = z.object({
  alarms: z
    .array(
      z.object({
        id: z.string(),
        time: z.string(),
        repeat: z.array(z.number()).default([]),
        label: z.string().optional(),
        enabled: z.boolean().default(true),
      }),
    )
    .default([]),
  stopwatch: z.object({
    running: z.boolean().default(false),
    time: z.number().default(0),
    laps: z.array(z.number()).default([]),
  }),
  timers: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        duration: z.number(),
        remaining: z.number(),
        running: z.boolean().default(false),
      }),
    )
    .default([]),
});

// 天气
const WeatherSchema = z.object({
  current: z
    .object({
      temp: z.number(),
      condition: z.string(),
      humidity: z.number(),
      wind: z.number(),
      icon: z.string(),
    })
    .optional(),
  forecast: z
    .array(
      z.object({
        date: z.string(),
        tempHigh: z.number(),
        tempLow: z.number(),
        condition: z.string(),
      }),
    )
    .default([]),
  location: z.string().optional(),
});

// 计算器
const CalculatorSchema = z.object({
  history: z
    .array(
      z.object({
        expression: z.string(),
        result: z.string(),
        timestamp: z.number(),
      }),
    )
    .default([]),
});

// 浏览器
const BrowserSchema = z.object({
  bookmarks: z
    .array(
      z.object({
        id: z.string(),
        title: z.string(),
        url: z.string(),
      }),
    )
    .default([]),
  history: z
    .array(
      z.object({
        url: z.string(),
        title: z.string(),
        timestamp: z.number(),
      }),
    )
    .default([]),
});

// 通知
const NotificationSchema = z.object({
  items: z
    .array(
      z.object({
        id: z.string(),
        app: z.string(),
        title: z.string(),
        content: z.string(),
        timestamp: z.number(),
        read: z.boolean().default(false),
      }),
    )
    .default([]),
});

// 主题
const ThemeSchema = z.object({
  current: z.string().default('default'),
  custom: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        colors: z.record(z.string(), z.string()),
      }),
    )
    .default([]),
});

// 设置
const SettingsSchema = z.object({
  theme: z.enum(['light', 'dark']).default('dark'),
  language: z.string().default('zh-CN'),
  notifications: z.boolean().default(true),
  sound: z.boolean().default(true),
  vibration: z.boolean().default(true),
  wallpaper: z.string().optional(),
  wallpaperLock: z.string().optional(),
});

// APP 数据
const AppsDataSchema = z.object({
  wallet: WalletSchema.default({}),
  music: MusicSchema.default({}),
  video: VideoSchema.default({}),
  shop: ShopSchema.default({}),
  map: MapSchema.default({}),
  calendar: CalendarSchema.default({}),
  notes: NotesSchema.default({}),
  gallery: GallerySchema.default({}),
  forum: ForumSchema.default({}),
  delivery: DeliverySchema.default({}),
  taxi: TaxiSchema.default({}),
  movie: MovieSchema.default({}),
  callLog: CallLogSchema.default({}),
  sms: SMSSchema.default({}),
  clock: ClockSchema.default({}),
  weather: WeatherSchema.default({}),
  calculator: CalculatorSchema.default({}),
  browser: BrowserSchema.default({}),
  notifications: NotificationSchema.default({}),
  theme: ThemeSchema.default({}),
  settings: SettingsSchema.default({}),
});

// 完整 Schema
export const PhoneSchema = z.object({
  device: DeviceSchema,
  contacts: ContactsSchema,
  conversations: ConversationSchema,
  apps: AppsDataSchema,
});

export type PhoneData = z.infer<typeof PhoneSchema>;
export type ApiConfig = {
  apiurl: string;
  key: string;
  model: string;
  source: string;
  temperature?: number;
  max_tokens?: number;
};
