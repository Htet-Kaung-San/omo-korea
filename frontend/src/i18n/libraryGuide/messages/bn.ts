import type { MessageDictionary } from '../../types'

const messages: MessageDictionary = {
  'library.subtitle': 'PNU লাইব্রেরি মোবাইল অ্যাপ (부산대 도서관_PNUL) ব্যবহারের নির্দেশিকা',
  'library.steps': 'ধাপ',
  'library.usageGuide': 'ব্যবহার নির্দেশিকা',

  'library.install.title': 'অ্যাপ ইনস্টল করুন',
  'library.install.step1':
    '[Google Play Store](https://play.google.com/store/apps/details?id=kr.ac.pusan.lib) (Android) বা Apple App Store (iOS)-এ "PNUL" বা "부산대 도서관" খুঁজে ইনস্টল করুন।',
  'library.install.step2':
    'আপনি যদি আগে পুরোনো "부산대 도서관" বা "PNU Place" অ্যাপ ব্যবহার করে থাকেন, সেগুলো বাতিল — এই নতুন অ্যাপ দুটোর বদলি।',
  'library.install.step3':
    'PNU ছাত্র পোর্টালের তথ্য দিয়ে লগইন করুন ([onestop.pusan.ac.kr](https://onestop.pusan.ac.kr/main)-এর মতো একই ID/পাসওয়ার্ড)।',

  'library.seatReservation.title': 'পাঠকক্ষ আসন সংরক্ষণ (열람실 좌석예약)',
  'library.seatReservation.tip1':
    'শুধুমাত্র অ্যাপের মাধ্যমে বরাদ্দকৃত আসন বৈধ — বরাদ্দ ছাড়া আসন ব্যবহার করে ধরা পড়লে লাইব্রেরি ব্যবহারে সীমাবদ্ধতা হবে।',
  'library.seatReservation.tip2':
    'সংরক্ষণের পর ১৫ মিনিটের মধ্যে প্রবেশ গেট পার হতে হবে, নাহলে বরাদ্দ বাতিল হবে।',
  'library.seatReservation.tip3':
    'সময় শেষ হওয়ার ২ ঘণ্টা আগে বাড়ানো শুরু হয়। প্রতিবার ৪ ঘণ্টা যোগ হয়, সর্বোচ্চ ৪ বার বাড়ানো যায়।',
  'library.seatReservation.tip4':
    'বাড়ানো অ্যাপে বা লাইব্রেরির ভেতরে 좌석배정기 (আসন বরাদ্দ কিওস্ক)-এ করা যায়।',
  'library.seatReservation.tip5': 'সময় শেষ হলে আসন স্বয়ংক্রিয়ভাবে ফেরত দেওয়া হয়।',
  'library.seatReservation.tip6':
    'নোট: 중앙도서관 (কেন্দ্রীয় লাইব্রেরি) মূলত সংগ্রহস্থল — এর কিছু পাঠকক্ষে আসন বরাদ্দের প্রয়োজন নেই।',
  'library.seatReservation.step1':
    'হোম স্ক্রিনে উপরের দিকে 좌석예약 (আসন সংরক্ষণ) প্যানেল খুঁজুন। সক্রিয় সংরক্ষণ না থাকলে "예약된 정보가 없습니다" (কোনো সংরক্ষণ তথ্য নেই) দেখাবে। নতুন সংরক্ষণের জন্য 배정신청 (বরাদ্দের আবেদন) ট্যাপ করুন, বা অতীতের জন্য 이용내역 (ব্যবহারের ইতিহাস)।',
  'library.seatReservation.step2':
    'ট্যাব সারি থেকে ভবন বেছে নিন — 나노생명, 의생명, 미리내, 새벽벌, বা 중앙।',
  'library.seatReservation.step3':
    'তলা (1층, 2층, ...) বেছে নিন, তারপর সেই তলার কক্ষের ধরনের ট্যাব (যেমন [새벽벌]열람실 পাঠকক্ষের জন্য vs. [새벽벌]PC PC জোনের জন্য)।',
  'library.seatReservation.step4':
    'প্রতিটি জোনের লাইভ দখল রিং চার্টে দেখাবে — যেমন "새벽누리-열람존 34/73" মানে ৭৩টির মধ্যে ৩৪টি দখল, ৩৯টি খালি।',
  'library.seatReservation.step5':
    'জোনে ট্যাপ করে আলাদা আসন বেছে নিয়ে নিশ্চিত করুন।',
  'library.seatReservation.image.homeScreen':
    'হোম স্ক্রিন — 배정신청 বোতামসহ 좌석예약 প্যানেল',
  'library.seatReservation.image.buildingFloor':
    'ভবন, তলা ও জোন নির্বাচন এবং লাইভ আসন দখল',

  'library.libraryCard.title': 'লাইব্রেরি কার্ড / 이용증',
  'library.libraryCard.step1': 'অ্যাপ খুলে উপরে 메뉴 (মেনু) → LOGIN দিয়ে লগইন করুন।',
  'library.libraryCard.step2':
    'নিচের নেভিগেশন বারে 이용증 ট্যাপ করুন — নিচের নেভ MY / 1:1 문의 / 홈 / 이용증 / 전체메뉴, সরাসরি ট্যাব, মেনুর ভেতরে নয়।',
  'library.libraryCard.step3':
    '이용증 স্ক্রিনে QR কোড দেখায় — এটি আপনার মোবাইল লাইব্রেরি কার্ড। প্রবেশের জন্য লাইব্রেরি গেটে স্ক্যান করুন।',
}

export default messages
