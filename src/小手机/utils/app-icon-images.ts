import appstoreIcon from '../assets/app-icons/appstore.png?url';
import bilibiliIcon from '../assets/app-icons/bilibili.png?url';
import browserIcon from '../assets/app-icons/browser.png?url';
import calculatorIcon from '../assets/app-icons/calculator.png?url';
import calendarIcon from '../assets/app-icons/calendar.png?url';
import cameraIcon from '../assets/app-icons/camera.png?url';
import clockIcon from '../assets/app-icons/clock.png?url';
import contactsIcon from '../assets/app-icons/contacts.png?url';
import deliveryIcon from '../assets/app-icons/delivery.png?url';
import filesIcon from '../assets/app-icons/files.png?url';
import forumIcon from '../assets/app-icons/forum.png?url';
import galleryIcon from '../assets/app-icons/gallery.png?url';
import homeIcon from '../assets/app-icons/home.png?url';
import liveIcon from '../assets/app-icons/live.png?url';
import mapIcon from '../assets/app-icons/map.png?url';
import messagesIcon from '../assets/app-icons/messages.png?url';
import movieIcon from '../assets/app-icons/movie.png?url';
import musicIcon from '../assets/app-icons/music.png?url';
import notesIcon from '../assets/app-icons/notes.png?url';
import notificationsIcon from '../assets/app-icons/notifications.png?url';
import phoneIcon from '../assets/app-icons/phone.png?url';
import secondhandIcon from '../assets/app-icons/secondhand.png?url';
import settingsIcon from '../assets/app-icons/settings.png?url';
import shopIcon from '../assets/app-icons/shop.png?url';
import smsIcon from '../assets/app-icons/sms.png?url';
import taxiIcon from '../assets/app-icons/taxi.png?url';
import themesIcon from '../assets/app-icons/themes.png?url';
import tiktokIcon from '../assets/app-icons/tiktok.png?url';
import walletIcon from '../assets/app-icons/wallet.png?url';
import weatherIcon from '../assets/app-icons/weather.png?url';

export const APP_ICON_IMAGES: Record<string, string> = {
  appstore: appstoreIcon,
  bilibili: bilibiliIcon,
  browser: browserIcon,
  calculator: calculatorIcon,
  calendar: calendarIcon,
  camera: cameraIcon,
  clock: clockIcon,
  contacts: contactsIcon,
  delivery: deliveryIcon,
  files: filesIcon,
  forum: forumIcon,
  gallery: galleryIcon,
  home: homeIcon,
  live: liveIcon,
  map: mapIcon,
  messages: messagesIcon,
  movie: movieIcon,
  music: musicIcon,
  notes: notesIcon,
  notifications: notificationsIcon,
  phone: phoneIcon,
  secondhand: secondhandIcon,
  settings: settingsIcon,
  shop: shopIcon,
  sms: smsIcon,
  taxi: taxiIcon,
  themes: themesIcon,
  tiktok: tiktokIcon,
  wallet: walletIcon,
  weather: weatherIcon,
};

const ICON_ALIAS_IMAGES: Record<string, string> = {
  'address-book': contactsIcon,
  bell: notificationsIcon,
  bilibili: bilibiliIcon,
  calculator: calculatorIcon,
  calendar: calendarIcon,
  camera: cameraIcon,
  car: taxiIcon,
  clock: clockIcon,
  cog: settingsIcon,
  comments: messagesIcon,
  'comments-alt': forumIcon,
  download: appstoreIcon,
  envelope: smsIcon,
  film: movieIcon,
  folder: filesIcon,
  globe: browserIcon,
  images: galleryIcon,
  live: liveIcon,
  map: mapIcon,
  music: musicIcon,
  palette: themesIcon,
  phone: phoneIcon,
  'second-hand': secondhandIcon,
  'shopping-bag': shopIcon,
  'sticky-note': notesIcon,
  sun: weatherIcon,
  tiktok: tiktokIcon,
  utensils: deliveryIcon,
  wallet: walletIcon,
};

export function getAppIconImage(idOrIcon: string): string | undefined {
  return APP_ICON_IMAGES[idOrIcon] ?? ICON_ALIAS_IMAGES[idOrIcon];
}
