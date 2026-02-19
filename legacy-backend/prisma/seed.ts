import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/* ═══════════════════════════════════════════════
 *  Seoul Childcare Facilities (100)
 * ═══════════════════════════════════════════════ */
const FACILITIES = [
  // 강남구 (8)
  { name: '해맑은 어린이집', type: '국공립', address: '서울 강남구 역삼로 123', district: '강남구', dong: '역삼동', lat: 37.4985, lng: 127.0280, capacity: 80, phone: '02-555-1234', hours: '07:30-19:30' },
  { name: '무지개 어린이집', type: '민간', address: '서울 강남구 테헤란로 456', district: '강남구', dong: '삼성동', lat: 37.5065, lng: 127.0345, capacity: 60, phone: '02-555-2345', hours: '07:00-20:00' },
  { name: '별빛 어린이집', type: '민간', address: '서울 강남구 논현로 789', district: '강남구', dong: '논현동', lat: 37.4960, lng: 127.0350, capacity: 45, phone: '02-555-3456', hours: '07:30-19:30' },
  { name: '도담도담 어린이집', type: '가정', address: '서울 강남구 선릉로 234', district: '강남구', dong: '대치동', lat: 37.5050, lng: 127.0450, capacity: 20, phone: '02-555-4567', hours: '07:30-19:00' },
  { name: '리틀스타 어린이집', type: '직장', address: '서울 강남구 삼성로 567', district: '강남구', dong: '삼성동', lat: 37.5100, lng: 127.0600, capacity: 30, phone: '02-555-5678', hours: '07:00-21:00' },
  { name: '사랑 어린이집', type: '가정', address: '서울 강남구 도산대로 100', district: '강남구', dong: '신사동', lat: 37.4870, lng: 127.0150, capacity: 15, phone: '02-555-6789', hours: '07:30-19:00' },
  { name: '아기곰 어린이집', type: '가정', address: '서울 강남구 봉은사로 200', district: '강남구', dong: '삼성동', lat: 37.5180, lng: 127.0520, capacity: 15, phone: '02-555-7890', hours: '07:30-19:00' },
  { name: '강남 키즈팜 어린이집', type: '민간', address: '서울 강남구 학동로 88', district: '강남구', dong: '논현동', lat: 37.5130, lng: 127.0290, capacity: 55, phone: '02-555-8901', hours: '07:00-20:00' },
  // 서초구 (8)
  { name: '햇살 어린이집', type: '국공립', address: '서울 서초구 서초중앙로 111', district: '서초구', dong: '서초동', lat: 37.4920, lng: 127.0100, capacity: 100, phone: '02-522-1111', hours: '07:30-19:30' },
  { name: '아이세상 어린이집', type: '민간', address: '서울 서초구 반포대로 222', district: '서초구', dong: '반포동', lat: 37.5050, lng: 127.0050, capacity: 50, phone: '02-522-2222', hours: '07:00-20:00' },
  { name: '꿈꾸는 어린이집', type: '국공립', address: '서울 서초구 양재대로 333', district: '서초구', dong: '양재동', lat: 37.4840, lng: 127.0350, capacity: 70, phone: '02-522-3333', hours: '07:30-19:30' },
  { name: '참좋은 어린이집', type: '사회복지', address: '서울 서초구 효령로 444', district: '서초구', dong: '방배동', lat: 37.4800, lng: 127.0200, capacity: 55, phone: '02-522-4444', hours: '07:30-19:30' },
  { name: '예쁜 어린이집', type: '가정', address: '서울 서초구 잠원로 555', district: '서초구', dong: '잠원동', lat: 37.5150, lng: 127.0080, capacity: 20, phone: '02-522-5555', hours: '07:30-19:00' },
  { name: '보석 어린이집', type: '민간', address: '서울 서초구 강남대로 200', district: '서초구', dong: '서초동', lat: 37.4960, lng: 127.0280, capacity: 40, phone: '02-522-6666', hours: '07:00-19:30' },
  { name: '행복나무 어린이집', type: '민간', address: '서울 서초구 바우뫼로 300', district: '서초구', dong: '양재동', lat: 37.4780, lng: 127.0350, capacity: 50, phone: '02-522-7777', hours: '07:00-20:00' },
  { name: '서초 포레스트 어린이집', type: '국공립', address: '서울 서초구 나루터로 66', district: '서초구', dong: '반포동', lat: 37.5020, lng: 127.0130, capacity: 85, phone: '02-522-8888', hours: '07:30-19:30' },
  // 송파구 (8)
  { name: '꿈나무 어린이집', type: '국공립', address: '서울 송파구 올림픽로 666', district: '송파구', dong: '잠실동', lat: 37.5150, lng: 127.1050, capacity: 90, phone: '02-421-6666', hours: '07:30-19:30' },
  { name: '하늘 어린이집', type: '민간', address: '서울 송파구 백제고분로 777', district: '송파구', dong: '송파동', lat: 37.5070, lng: 127.0850, capacity: 40, phone: '02-421-7777', hours: '07:00-19:30' },
  { name: '사랑나무 어린이집', type: '국공립', address: '서울 송파구 잠실로 888', district: '송파구', dong: '잠실동', lat: 37.5120, lng: 127.0950, capacity: 85, phone: '02-421-8888', hours: '07:30-19:30' },
  { name: '초록빛 어린이집', type: '민간', address: '서울 송파구 송이로 999', district: '송파구', dong: '가락동', lat: 37.4950, lng: 127.1100, capacity: 35, phone: '02-421-9999', hours: '07:00-20:00' },
  { name: '토끼 어린이집', type: '가정', address: '서울 송파구 마천로 100', district: '송파구', dong: '마천동', lat: 37.5000, lng: 127.1200, capacity: 20, phone: '02-421-0000', hours: '07:30-19:00' },
  { name: '은하수 어린이집', type: '국공립', address: '서울 송파구 중대로 300', district: '송파구', dong: '문정동', lat: 37.5030, lng: 127.0900, capacity: 75, phone: '02-421-1234', hours: '07:30-19:30' },
  { name: '한울 어린이집', type: '국공립', address: '서울 송파구 가락로 400', district: '송파구', dong: '가락동', lat: 37.4980, lng: 127.1020, capacity: 80, phone: '02-421-5678', hours: '07:30-19:30' },
  { name: '송파 레이크 어린이집', type: '민간', address: '서울 송파구 석촌호수로 55', district: '송파구', dong: '석촌동', lat: 37.5085, lng: 127.0990, capacity: 45, phone: '02-421-3456', hours: '07:00-19:30' },
  // 강동구 (6)
  { name: '파란하늘 어린이집', type: '국공립', address: '서울 강동구 천호대로 111', district: '강동구', dong: '천호동', lat: 37.5380, lng: 127.1240, capacity: 75, phone: '02-470-1111', hours: '07:30-19:30' },
  { name: '아이꿈 어린이집', type: '민간', address: '서울 강동구 양재대로 222', district: '강동구', dong: '길동', lat: 37.5300, lng: 127.1320, capacity: 50, phone: '02-470-2222', hours: '07:00-20:00' },
  { name: '행복한 어린이집', type: '국공립', address: '서울 강동구 강동대로 333', district: '강동구', dong: '명일동', lat: 37.5450, lng: 127.1400, capacity: 80, phone: '02-470-3333', hours: '07:30-19:30' },
  { name: '솔이 어린이집', type: '가정', address: '서울 강동구 상일로 400', district: '강동구', dong: '상일동', lat: 37.5520, lng: 127.1500, capacity: 18, phone: '02-470-4444', hours: '07:30-19:00' },
  { name: '별나라 어린이집', type: '민간', address: '서울 강동구 아리수로 700', district: '강동구', dong: '암사동', lat: 37.5480, lng: 127.1350, capacity: 40, phone: '02-470-5555', hours: '07:00-20:00' },
  { name: '강동 리버 어린이집', type: '국공립', address: '서울 강동구 고덕로 88', district: '강동구', dong: '고덕동', lat: 37.5570, lng: 127.1580, capacity: 70, phone: '02-470-6666', hours: '07:30-19:30' },
  // 마포구 (6)
  { name: '마포 해오름 어린이집', type: '국공립', address: '서울 마포구 월드컵로 444', district: '마포구', dong: '성산동', lat: 37.5560, lng: 126.9080, capacity: 70, phone: '02-332-4444', hours: '07:30-19:30' },
  { name: '홍대 어린이집', type: '민간', address: '서울 마포구 양화로 555', district: '마포구', dong: '서교동', lat: 37.5500, lng: 126.9200, capacity: 45, phone: '02-332-5555', hours: '07:00-20:00' },
  { name: '연남 어린이집', type: '가정', address: '서울 마포구 연남로 666', district: '마포구', dong: '연남동', lat: 37.5620, lng: 126.9250, capacity: 20, phone: '02-332-6666', hours: '07:30-19:00' },
  { name: '숲속 어린이집', type: '국공립', address: '서울 마포구 성미산로 500', district: '마포구', dong: '성산동', lat: 37.5650, lng: 126.9150, capacity: 65, phone: '02-332-7777', hours: '07:30-19:30' },
  { name: '미래 어린이집', type: '직장', address: '서울 마포구 매봉산로 500', district: '마포구', dong: '상암동', lat: 37.5580, lng: 126.9350, capacity: 40, phone: '02-332-8888', hours: '07:00-21:00' },
  { name: '마포 그린 어린이집', type: '민간', address: '서울 마포구 와우산로 33', district: '마포구', dong: '서교동', lat: 37.5520, lng: 126.9230, capacity: 35, phone: '02-332-9999', hours: '07:00-20:00' },
  // 용산구 (5)
  { name: '이태원 어린이집', type: '국공립', address: '서울 용산구 이태원로 777', district: '용산구', dong: '이태원동', lat: 37.5340, lng: 126.9870, capacity: 65, phone: '02-792-7777', hours: '07:30-19:30' },
  { name: '한남 어린이집', type: '민간', address: '서울 용산구 한남대로 888', district: '용산구', dong: '한남동', lat: 37.5350, lng: 127.0020, capacity: 40, phone: '02-792-8888', hours: '07:00-20:00' },
  { name: '달빛 어린이집', type: '민간', address: '서울 용산구 녹사평대로 600', district: '용산구', dong: '이태원동', lat: 37.5370, lng: 126.9920, capacity: 35, phone: '02-792-1234', hours: '07:00-20:00' },
  { name: '샛별 어린이집', type: '민간', address: '서울 용산구 이촌로 100', district: '용산구', dong: '이촌동', lat: 37.5220, lng: 126.9730, capacity: 35, phone: '02-792-5678', hours: '07:00-20:00' },
  { name: '용산 파크 어린이집', type: '국공립', address: '서울 용산구 서빙고로 77', district: '용산구', dong: '서빙고동', lat: 37.5230, lng: 126.9850, capacity: 60, phone: '02-792-2345', hours: '07:30-19:30' },
  // 영등포구 (5)
  { name: '여의도 어린이집', type: '직장', address: '서울 영등포구 여의대로 999', district: '영등포구', dong: '여의도동', lat: 37.5250, lng: 126.9240, capacity: 50, phone: '02-784-9999', hours: '07:00-21:00' },
  { name: '당산 어린이집', type: '국공립', address: '서울 영등포구 당산로 100', district: '영등포구', dong: '당산동', lat: 37.5340, lng: 126.9020, capacity: 60, phone: '02-784-0000', hours: '07:30-19:30' },
  { name: '나비 어린이집', type: '가정', address: '서울 영등포구 도림로 700', district: '영등포구', dong: '대림동', lat: 37.5280, lng: 126.9100, capacity: 20, phone: '02-784-1234', hours: '07:30-19:00' },
  { name: '영등포 스카이 어린이집', type: '민간', address: '서울 영등포구 영중로 55', district: '영등포구', dong: '영등포동', lat: 37.5170, lng: 126.9080, capacity: 45, phone: '02-784-2345', hours: '07:00-20:00' },
  { name: '문래 어린이집', type: '국공립', address: '서울 영등포구 문래로 44', district: '영등포구', dong: '문래동', lat: 37.5180, lng: 126.8960, capacity: 55, phone: '02-784-3456', hours: '07:30-19:30' },
  // 성동구 (5)
  { name: '성수 어린이집', type: '민간', address: '서울 성동구 성수이로 111', district: '성동구', dong: '성수동', lat: 37.5430, lng: 127.0560, capacity: 45, phone: '02-498-1111', hours: '07:00-20:00' },
  { name: '왕십리 어린이집', type: '국공립', address: '서울 성동구 왕십리로 222', district: '성동구', dong: '행당동', lat: 37.5600, lng: 127.0380, capacity: 80, phone: '02-498-2222', hours: '07:30-19:30' },
  { name: '산들바람 어린이집', type: '국공립', address: '서울 성동구 금호로 800', district: '성동구', dong: '금호동', lat: 37.5550, lng: 127.0250, capacity: 70, phone: '02-498-3333', hours: '07:30-19:30' },
  { name: '라온 어린이집', type: '가정', address: '서울 성동구 마조로 900', district: '성동구', dong: '옥수동', lat: 37.5480, lng: 127.0480, capacity: 18, phone: '02-498-4444', hours: '07:30-19:00' },
  { name: '성동 아트 어린이집', type: '민간', address: '서울 성동구 서울숲길 22', district: '성동구', dong: '성수동', lat: 37.5440, lng: 127.0440, capacity: 40, phone: '02-498-5555', hours: '07:00-19:30' },
  // 관악구 (5)
  { name: '봉천 어린이집', type: '국공립', address: '서울 관악구 봉천로 333', district: '관악구', dong: '봉천동', lat: 37.4810, lng: 126.9530, capacity: 70, phone: '02-877-3333', hours: '07:30-19:30' },
  { name: '신림 어린이집', type: '민간', address: '서울 관악구 신림로 444', district: '관악구', dong: '신림동', lat: 37.4750, lng: 126.9270, capacity: 55, phone: '02-877-4444', hours: '07:00-19:30' },
  { name: '구름 어린이집', type: '민간', address: '서울 관악구 조원로 900', district: '관악구', dong: '조원동', lat: 37.4680, lng: 126.9400, capacity: 45, phone: '02-877-5555', hours: '07:00-19:30' },
  { name: '푸른솔 어린이집', type: '국공립', address: '서울 관악구 낙성대로 800', district: '관악구', dong: '낙성대동', lat: 37.4770, lng: 126.9620, capacity: 65, phone: '02-877-6666', hours: '07:30-19:30' },
  { name: '관악 별빛 어린이집', type: '가정', address: '서울 관악구 관악로 11', district: '관악구', dong: '신림동', lat: 37.4720, lng: 126.9310, capacity: 20, phone: '02-877-7777', hours: '07:30-19:00' },
  // 노원구 (5)
  { name: '노원 해맑은 어린이집', type: '국공립', address: '서울 노원구 동일로 555', district: '노원구', dong: '상계동', lat: 37.6550, lng: 127.0640, capacity: 90, phone: '02-932-5555', hours: '07:30-19:30' },
  { name: '중계 어린이집', type: '민간', address: '서울 노원구 중계로 666', district: '노원구', dong: '중계동', lat: 37.6430, lng: 127.0750, capacity: 50, phone: '02-932-6666', hours: '07:00-20:00' },
  { name: '꽃잎 어린이집', type: '국공립', address: '서울 노원구 한글비석로 100', district: '노원구', dong: '하계동', lat: 37.6600, lng: 127.0550, capacity: 85, phone: '02-932-7777', hours: '07:30-19:30' },
  { name: '솔잎 어린이집', type: '국공립', address: '서울 노원구 노해로 600', district: '노원구', dong: '상계동', lat: 37.6520, lng: 127.0680, capacity: 75, phone: '02-932-8888', hours: '07:30-19:30' },
  { name: '노원 숲 어린이집', type: '민간', address: '서울 노원구 덕릉로 77', district: '노원구', dong: '월계동', lat: 37.6350, lng: 127.0580, capacity: 40, phone: '02-932-9999', hours: '07:00-19:30' },
  // 서대문구 (5)
  { name: '연세 어린이집', type: '국공립', address: '서울 서대문구 연세로 11', district: '서대문구', dong: '신촌동', lat: 37.5580, lng: 126.9360, capacity: 75, phone: '02-393-1111', hours: '07:30-19:30' },
  { name: '홍은 어린이집', type: '민간', address: '서울 서대문구 통일로 222', district: '서대문구', dong: '홍은동', lat: 37.5780, lng: 126.9400, capacity: 45, phone: '02-393-2222', hours: '07:00-20:00' },
  { name: '이화 어린이집', type: '국공립', address: '서울 서대문구 이화여대길 33', district: '서대문구', dong: '대현동', lat: 37.5620, lng: 126.9460, capacity: 60, phone: '02-393-3333', hours: '07:30-19:30' },
  { name: '충정 어린이집', type: '가정', address: '서울 서대문구 충정로 44', district: '서대문구', dong: '충정로', lat: 37.5560, lng: 126.9590, capacity: 18, phone: '02-393-4444', hours: '07:30-19:00' },
  { name: '서대문 하늘 어린이집', type: '사회복지', address: '서울 서대문구 모래내로 55', district: '서대문구', dong: '남가좌동', lat: 37.5700, lng: 126.9180, capacity: 55, phone: '02-393-5555', hours: '07:30-19:30' },
  // 동작구 (5)
  { name: '사당 어린이집', type: '국공립', address: '서울 동작구 사당로 11', district: '동작구', dong: '사당동', lat: 37.4840, lng: 126.9820, capacity: 70, phone: '02-823-1111', hours: '07:30-19:30' },
  { name: '노량진 어린이집', type: '민간', address: '서울 동작구 노량진로 22', district: '동작구', dong: '노량진동', lat: 37.5130, lng: 126.9420, capacity: 40, phone: '02-823-2222', hours: '07:00-20:00' },
  { name: '흑석 어린이집', type: '국공립', address: '서울 동작구 흑석로 33', district: '동작구', dong: '흑석동', lat: 37.5080, lng: 126.9630, capacity: 65, phone: '02-823-3333', hours: '07:30-19:30' },
  { name: '동작 어린이집', type: '가정', address: '서울 동작구 동작대로 44', district: '동작구', dong: '동작동', lat: 37.4970, lng: 126.9740, capacity: 20, phone: '02-823-4444', hours: '07:30-19:00' },
  { name: '보라매 어린이집', type: '민간', address: '서울 동작구 보라매로 55', district: '동작구', dong: '신대방동', lat: 37.4880, lng: 126.9280, capacity: 50, phone: '02-823-5555', hours: '07:00-19:30' },
  // 광진구 (4)
  { name: '광진 어린이집', type: '국공립', address: '서울 광진구 자양로 11', district: '광진구', dong: '자양동', lat: 37.5380, lng: 127.0690, capacity: 75, phone: '02-456-1111', hours: '07:30-19:30' },
  { name: '건대 어린이집', type: '민간', address: '서울 광진구 능동로 22', district: '광진구', dong: '화양동', lat: 37.5410, lng: 127.0680, capacity: 45, phone: '02-456-2222', hours: '07:00-20:00' },
  { name: '어린이대공원 어린이집', type: '국공립', address: '서울 광진구 광나루로 33', district: '광진구', dong: '능동', lat: 37.5500, lng: 127.0800, capacity: 80, phone: '02-456-3333', hours: '07:30-19:30' },
  { name: '구의 어린이집', type: '가정', address: '서울 광진구 구의로 44', district: '광진구', dong: '구의동', lat: 37.5440, lng: 127.0870, capacity: 20, phone: '02-456-4444', hours: '07:30-19:00' },
  // 중구 (3)
  { name: '명동 어린이집', type: '직장', address: '서울 중구 명동길 11', district: '중구', dong: '명동', lat: 37.5630, lng: 126.9860, capacity: 35, phone: '02-776-1111', hours: '07:00-21:00' },
  { name: '을지로 어린이집', type: '국공립', address: '서울 중구 을지로 22', district: '중구', dong: '을지로', lat: 37.5660, lng: 126.9920, capacity: 55, phone: '02-776-2222', hours: '07:30-19:30' },
  { name: '장충 어린이집', type: '민간', address: '서울 중구 장충로 33', district: '중구', dong: '장충동', lat: 37.5590, lng: 127.0020, capacity: 40, phone: '02-776-3333', hours: '07:00-19:30' },
  // 종로구 (3)
  { name: '삼청 어린이집', type: '국공립', address: '서울 종로구 삼청로 11', district: '종로구', dong: '삼청동', lat: 37.5830, lng: 126.9820, capacity: 50, phone: '02-720-1111', hours: '07:30-19:30' },
  { name: '혜화 어린이집', type: '민간', address: '서울 종로구 혜화로 22', district: '종로구', dong: '혜화동', lat: 37.5870, lng: 127.0010, capacity: 35, phone: '02-720-2222', hours: '07:00-19:30' },
  { name: '인사동 어린이집', type: '가정', address: '서울 종로구 인사동길 33', district: '종로구', dong: '인사동', lat: 37.5740, lng: 126.9860, capacity: 18, phone: '02-720-3333', hours: '07:30-19:00' },
  // 강서구 (5)
  { name: '마곡 어린이집', type: '국공립', address: '서울 강서구 마곡중앙로 11', district: '강서구', dong: '마곡동', lat: 37.5610, lng: 126.8370, capacity: 90, phone: '02-2659-1111', hours: '07:30-19:30' },
  { name: '화곡 어린이집', type: '민간', address: '서울 강서구 화곡로 22', district: '강서구', dong: '화곡동', lat: 37.5430, lng: 126.8490, capacity: 55, phone: '02-2659-2222', hours: '07:00-20:00' },
  { name: '발산 어린이집', type: '국공립', address: '서울 강서구 발산로 33', district: '강서구', dong: '내발산동', lat: 37.5500, lng: 126.8380, capacity: 70, phone: '02-2659-3333', hours: '07:30-19:30' },
  { name: '등촌 어린이집', type: '가정', address: '서울 강서구 등촌로 44', district: '강서구', dong: '등촌동', lat: 37.5560, lng: 126.8560, capacity: 20, phone: '02-2659-4444', hours: '07:30-19:00' },
  { name: '강서 파크 어린이집', type: '사회복지', address: '서울 강서구 공항대로 55', district: '강서구', dong: '방화동', lat: 37.5740, lng: 126.8150, capacity: 60, phone: '02-2659-5555', hours: '07:30-19:30' },
  // 양천구 (4)
  { name: '목동 어린이집', type: '국공립', address: '서울 양천구 목동로 11', district: '양천구', dong: '목동', lat: 37.5280, lng: 126.8680, capacity: 85, phone: '02-2646-1111', hours: '07:30-19:30' },
  { name: '신정 어린이집', type: '민간', address: '서울 양천구 신정로 22', district: '양천구', dong: '신정동', lat: 37.5170, lng: 126.8570, capacity: 50, phone: '02-2646-2222', hours: '07:00-20:00' },
  { name: '양천 해맑은 어린이집', type: '국공립', address: '서울 양천구 목동서로 33', district: '양천구', dong: '목동', lat: 37.5310, lng: 126.8750, capacity: 75, phone: '02-2646-3333', hours: '07:30-19:30' },
  { name: '신월 어린이집', type: '가정', address: '서울 양천구 신월로 44', district: '양천구', dong: '신월동', lat: 37.5200, lng: 126.8350, capacity: 18, phone: '02-2646-4444', hours: '07:30-19:00' },
  // 은평구 (4)
  { name: '불광 어린이집', type: '국공립', address: '서울 은평구 불광로 11', district: '은평구', dong: '불광동', lat: 37.6100, lng: 126.9310, capacity: 70, phone: '02-353-1111', hours: '07:30-19:30' },
  { name: '수색 어린이집', type: '민간', address: '서울 은평구 수색로 22', district: '은평구', dong: '수색동', lat: 37.5880, lng: 126.9030, capacity: 40, phone: '02-353-2222', hours: '07:00-19:30' },
  { name: '응암 어린이집', type: '국공립', address: '서울 은평구 응암로 33', district: '은평구', dong: '응암동', lat: 37.5960, lng: 126.9170, capacity: 65, phone: '02-353-3333', hours: '07:30-19:30' },
  { name: '은평 뉴타운 어린이집', type: '민간', address: '서울 은평구 진관동 44', district: '은평구', dong: '진관동', lat: 37.6330, lng: 126.9290, capacity: 55, phone: '02-353-4444', hours: '07:00-20:00' },
]

const AGE_GROUPS = ['0세반', '1세반', '2세반', '3세반', '4세반', '5세반']

const NEIGHBORHOODS = [
  { district: '강남구', dongs: ['역삼동', '삼성동', '논현동', '대치동', '신사동'] },
  { district: '서초구', dongs: ['서초동', '반포동', '양재동', '방배동', '잠원동'] },
  { district: '송파구', dongs: ['잠실동', '송파동', '가락동', '마천동', '문정동', '석촌동'] },
  { district: '강동구', dongs: ['천호동', '길동', '명일동', '상일동', '암사동', '고덕동'] },
  { district: '마포구', dongs: ['성산동', '서교동', '연남동', '상암동'] },
  { district: '용산구', dongs: ['이태원동', '한남동', '이촌동', '서빙고동'] },
  { district: '영등포구', dongs: ['여의도동', '당산동', '대림동', '영등포동', '문래동'] },
  { district: '성동구', dongs: ['성수동', '행당동', '금호동', '옥수동'] },
  { district: '관악구', dongs: ['봉천동', '신림동', '조원동', '낙성대동'] },
  { district: '노원구', dongs: ['상계동', '중계동', '하계동', '월계동'] },
  { district: '서대문구', dongs: ['신촌동', '홍은동', '대현동', '충정로', '남가좌동'] },
  { district: '동작구', dongs: ['사당동', '노량진동', '흑석동', '동작동', '신대방동'] },
  { district: '광진구', dongs: ['자양동', '화양동', '능동', '구의동'] },
  { district: '중구', dongs: ['명동', '을지로', '장충동'] },
  { district: '종로구', dongs: ['삼청동', '혜화동', '인사동'] },
  { district: '강서구', dongs: ['마곡동', '화곡동', '내발산동', '등촌동', '방화동'] },
  { district: '양천구', dongs: ['목동', '신정동', '신월동'] },
  { district: '은평구', dongs: ['불광동', '수색동', '응암동', '진관동'] },
]

function randomDate(daysBack: number): Date {
  return new Date(Date.now() - Math.floor(Math.random() * daysBack) * 24 * 60 * 60 * 1000)
}

async function main() {
  console.log('🌱 Seeding database with 100 Seoul facilities...')

  // ─── Neighborhoods ───
  let neighborhoodCount = 0
  for (const n of NEIGHBORHOODS) {
    for (const dong of n.dongs) {
      await prisma.neighborhood.upsert({
        where: { city_district_dong: { city: '서울', district: n.district, dong } },
        update: {},
        create: { city: '서울', district: n.district, dong },
      })
      neighborhoodCount++
    }
  }
  console.log(`✅ Neighborhoods: ${neighborhoodCount}`)

  // ─── Users ───
  const user1 = await prisma.user.upsert({
    where: { email: 'minji.mom@email.com' },
    update: {},
    create: {
      email: 'minji.mom@email.com',
      name: '민지 엄마',
      provider: 'kakao',
      plan: 'pro',
      isOnboarded: true,
      children: {
        create: [
          { name: '민지', birthDate: new Date('2024-06-15'), gender: 'F' },
          { name: '서준', birthDate: new Date('2025-11-20'), gender: 'M' },
        ],
      },
    },
  })

  const user2 = await prisma.user.upsert({
    where: { email: 'hyunsoo.dad@email.com' },
    update: {},
    create: {
      email: 'hyunsoo.dad@email.com',
      name: '현수 아빠',
      provider: 'naver',
      plan: 'basic',
      isOnboarded: true,
      children: { create: [{ name: '현수', birthDate: new Date('2023-03-20'), gender: 'M' }] },
    },
  })

  const user3 = await prisma.user.upsert({
    where: { email: 'yuna.mom@email.com' },
    update: {},
    create: {
      email: 'yuna.mom@email.com',
      name: '유나 엄마',
      provider: 'kakao',
      plan: 'free',
      isOnboarded: true,
      children: { create: [{ name: '유나', birthDate: new Date('2024-01-10'), gender: 'F' }] },
    },
  })

  const admin = await prisma.user.upsert({
    where: { email: 'admin@dotori.ai' },
    update: {},
    create: {
      email: 'admin@dotori.ai',
      name: '관리자',
      provider: 'email',
      plan: 'pro',
      role: 'admin',
      isOnboarded: true,
    },
  })

  console.log(`✅ Users: ${user1.name}, ${user2.name}, ${user3.name}, ${admin.name}`)

  // ─── Daycares (for TO alert subscriptions) ───
  const daycareIds: string[] = []
  for (const f of FACILITIES.slice(0, 20)) {
    const daycareId = `dc_${f.name.replace(/\s/g, '_')}`
    await prisma.daycare.upsert({
      where: { id: daycareId },
      update: {},
      create: {
        id: daycareId,
        name: f.name,
        district: f.district,
        dong: f.dong,
        type: f.type,
        address: f.address,
        lat: f.lat,
        lng: f.lng,
      },
    })
    daycareIds.push(daycareId)
  }
  console.log(`✅ Daycares: ${daycareIds.length}`)

  // ─── Facilities ───
  const facilityRecords = []
  for (const f of FACILITIES) {
    const enrollRate = 0.7 + Math.random() * 0.25
    const record = await prisma.facility.upsert({
      where: { id: `fac_${f.name.replace(/\s/g, '_')}` },
      update: { capacity: f.capacity, currentEnroll: Math.floor(f.capacity * enrollRate) },
      create: {
        id: `fac_${f.name.replace(/\s/g, '_')}`,
        name: f.name,
        type: f.type,
        address: f.address,
        city: '서울특별시',
        district: f.district,
        dong: f.dong,
        lat: f.lat,
        lng: f.lng,
        capacity: f.capacity,
        phone: f.phone,
        operatingHours: f.hours,
        currentEnroll: Math.floor(f.capacity * enrollRate),
        monthlyCost: f.type === '국공립' ? 300000 : f.type === '가정' ? 350000 : 450000,
        rating: 3.5 + Math.random() * 1.5,
        reviewCount: Math.floor(Math.random() * 50) + 5,
        establishedYear: 2010 + Math.floor(Math.random() * 14),
        features: getRandomFeatures(f.type),
      },
    })
    facilityRecords.push(record)
  }
  console.log(`✅ Facilities: ${facilityRecords.length}`)

  // ─── Age Groups ───
  let ageGroupCount = 0
  for (const fac of facilityRecords) {
    const numGroups = fac.capacity > 50 ? 5 : fac.capacity > 30 ? 4 : 3
    for (let i = 0; i < numGroups; i++) {
      const groupCap = Math.floor(fac.capacity / numGroups)
      const enrolled = Math.floor(groupCap * (0.75 + Math.random() * 0.2))
      const waitlist = fac.type === '국공립' ? Math.floor(Math.random() * 25) + 5 : Math.floor(Math.random() * 10) + 1
      await prisma.ageClass.upsert({
        where: { facilityId_ageGroup: { facilityId: fac.id, ageGroup: AGE_GROUPS[i] } },
        update: { currentCount: enrolled, waitlistCount: waitlist },
        create: {
          facilityId: fac.id,
          ageGroup: AGE_GROUPS[i],
          capacity: groupCap,
          currentCount: enrolled,
          waitlistCount: waitlist,
        },
      })
      ageGroupCount++
    }
  }
  console.log(`✅ Age Groups: ${ageGroupCount}`)

  // ─── TO Events (12 months of history) ───
  let toEventCount = 0
  for (const fac of facilityRecords) {
    const numEvents = fac.type === '국공립' ? Math.floor(Math.random() * 8) + 3 : Math.floor(Math.random() * 5) + 1
    for (let i = 0; i < numEvents; i++) {
      const ageIdx = Math.floor(Math.random() * 4)
      await prisma.tOEvent.create({
        data: {
          facilityId: fac.id,
          ageGroup: AGE_GROUPS[ageIdx],
          slots: Math.random() > 0.7 ? 2 : 1,
          reason: ['졸업', '이사', '전학', '연장보육 종료'][Math.floor(Math.random() * 4)],
          occurredAt: randomDate(365),
        },
      })
      toEventCount++
    }
  }
  console.log(`✅ TO Events: ${toEventCount}`)

  // ─── Probabilities ───
  let probCount = 0
  for (const fac of facilityRecords) {
    const numGroups = fac.capacity > 50 ? 5 : fac.capacity > 30 ? 4 : 3
    for (let i = 0; i < Math.min(numGroups, 4); i++) {
      const baseProb = fac.type === '국공립' ? 30 + Math.random() * 40 : 40 + Math.random() * 45
      const prob = Math.round(baseProb * 10) / 10
      const grade = prob >= 80 ? 'A' : prob >= 60 ? 'B' : prob >= 40 ? 'C' : prob >= 25 ? 'D' : 'E'
      await prisma.probabilityCache.upsert({
        where: { facilityId_ageGroup: { facilityId: fac.id, ageGroup: AGE_GROUPS[i] } },
        update: { probability: prob, grade },
        create: {
          facilityId: fac.id,
          ageGroup: AGE_GROUPS[i],
          probability: prob,
          grade,
          factors: {
            positionScore: 10 + Math.random() * 25,
            vacancyScore: 5 + Math.random() * 15,
            toScore: 3 + Math.random() * 12,
            priorityScore: 8 + Math.random() * 7,
            bonusScore: Math.random() * 10,
          },
        },
      })
      probCount++
    }
  }
  console.log(`✅ Probabilities: ${probCount}`)

  // ─── Favorites ───
  const favFacilities = [facilityRecords[0], facilityRecords[8], facilityRecords[16], facilityRecords[24], facilityRecords[30]]
  await prisma.favorite.createMany({
    data: [
      { userId: user1.id, facilityId: favFacilities[0].id },
      { userId: user1.id, facilityId: favFacilities[1].id },
      { userId: user1.id, facilityId: favFacilities[2].id },
      { userId: user2.id, facilityId: favFacilities[3].id },
      { userId: user2.id, facilityId: favFacilities[4].id },
      { userId: user3.id, facilityId: favFacilities[0].id },
      { userId: user3.id, facilityId: favFacilities[2].id },
    ],
  })

  // ─── Alerts (다양한 타입) ───
  const alertData = [
    { userId: user1.id, facilityId: favFacilities[0].id, type: 'to', title: 'TO 발생!', body: `${favFacilities[0].name} 0세반에 1자리가 생겼습니다!`, actionUrl: `/facility/${favFacilities[0].id}` },
    { userId: user1.id, facilityId: favFacilities[1].id, type: 'to', title: 'TO 발생!', body: `${favFacilities[1].name} 1세반에 2자리가 생겼습니다!`, actionUrl: `/facility/${favFacilities[1].id}` },
    { userId: user1.id, facilityId: favFacilities[2].id, type: 'probability', title: '확률 변동', body: `${favFacilities[2].name} 입소 확률이 45%→62%로 상승했습니다.`, actionUrl: `/facility/${favFacilities[2].id}` },
    { userId: user2.id, facilityId: favFacilities[3].id, type: 'to', title: 'TO 발생!', body: `${favFacilities[3].name} 2세반에 1자리가 생겼습니다!`, actionUrl: `/facility/${favFacilities[3].id}` },
    { userId: user3.id, facilityId: favFacilities[0].id, type: 'community', title: '새 댓글', body: '이웃에 새 글이 올라왔어요.', actionUrl: '/community' },
    { userId: user1.id, type: 'system', title: '도토리 업데이트', body: '새로운 기능이 추가되었습니다. 확인해보세요!', actionUrl: '/home' },
  ]
  await prisma.alert.createMany({ data: alertData })

  // ─── TO Alert Subscriptions ───
  await prisma.toAlertSubscription.createMany({
    data: [
      { userId: user1.id, daycareId: daycareIds[0], age: 0, enabled: true },
      { userId: user1.id, daycareId: daycareIds[8], age: 0, enabled: true },
      { userId: user2.id, daycareId: daycareIds[16], age: 2, enabled: true },
      { userId: user3.id, daycareId: daycareIds[0], age: 1, enabled: true },
    ],
  })

  // ─── Waitlist Entries ───
  const children1 = await prisma.child.findMany({ where: { userId: user1.id } })
  const children2 = await prisma.child.findMany({ where: { userId: user2.id } })
  if (children1[0]) {
    await prisma.waitlistEntry.createMany({
      data: [
        { userId: user1.id, childId: children1[0].id, facilityId: favFacilities[0].id, ageGroup: '0세반', priority: 1, queueNumber: 3 },
        { userId: user1.id, childId: children1[0].id, facilityId: favFacilities[1].id, ageGroup: '0세반', priority: 2, queueNumber: 8 },
      ],
    })
  }
  if (children2[0]) {
    await prisma.waitlistEntry.create({
      data: { userId: user2.id, childId: children2[0].id, facilityId: favFacilities[3].id, ageGroup: '2세반', priority: 1, queueNumber: 5 },
    })
  }

  // ─── Consults ───
  await prisma.consult.create({
    data: {
      userId: user1.id,
      type: 'ai',
      status: 'completed',
      summary: 'AI 맞춤 입소 전략 분석 — 강남/서초 0세반 중심',
      report: {
        title: '입소 전략 보고서',
        generatedAt: new Date().toISOString(),
        sections: [
          { heading: '현황 분석', content: '강남구 0세반 대기 순위 3번, 서초구 1지망 확률 72%' },
          { heading: '추천 전략', content: '2지망 추가 신청 (+12%p), 가점 확인 (+8%p), 연장보육 신청 (+5%p)' },
          { heading: '타임라인', content: '2026년 3월 입소 시즌 대비 2월 중 서류 점검 권장' },
        ],
      },
    },
  })

  // ─── Community Posts ───
  const gangnamNeighborhood = await prisma.neighborhood.findFirst({ where: { district: '강남구', dong: '역삼동' } })
  const seochoNeighborhood = await prisma.neighborhood.findFirst({ where: { district: '서초구', dong: '서초동' } })
  if (gangnamNeighborhood) {
    await prisma.communityPost.createMany({
      data: [
        { neighborhoodId: gangnamNeighborhood.id, authorId: user1.id, title: '역삼동 해맑은 어린이집 후기', body: '최근 입소한 엄마입니다. 선생님들이 정말 따뜻하시고 시설도 깨끗해요. 급식도 유기농 위주라 만족합니다.', likeCount: 12, commentCount: 3 },
        { neighborhoodId: gangnamNeighborhood.id, authorId: user3.id, title: '강남구 0세반 대기 현황 공유', body: '2월 기준으로 국공립 평균 대기 15명, 민간은 5-8명 정도입니다. 3월 입소 시즌 대비해서 서류 미리 준비하세요!', likeCount: 24, commentCount: 7 },
        { neighborhoodId: gangnamNeighborhood.id, authorId: user2.id, body: '혹시 역삼동에서 연장보육 가능한 어린이집 아시는 분 계신가요? 맞벌이라 19시 이후도 필요합니다.', likeCount: 5, commentCount: 2 },
      ],
    })
  }
  if (seochoNeighborhood) {
    await prisma.communityPost.createMany({
      data: [
        { neighborhoodId: seochoNeighborhood.id, authorId: user2.id, title: '서초구 가점 활용 팁', body: '다자녀 가점이 생각보다 크더라고요. 둘째 계획 있으신 분들은 미리 신청해두시면 좋습니다. 맞벌이 가점도 중복 적용 가능해요.', likeCount: 31, commentCount: 9 },
        { neighborhoodId: seochoNeighborhood.id, authorId: user1.id, body: '서초구 햇살 어린이집 TO 나온 거 아시나요? 방금 알림 받았어요!', likeCount: 8, commentCount: 4 },
      ],
    })
  }

  console.log('✅ Seed complete!')
  console.log(`   Users: 4, Facilities: ${facilityRecords.length}, AgeGroups: ${ageGroupCount}`)
  console.log(`   TO Events: ${toEventCount}, Probabilities: ${probCount}, Neighborhoods: ${neighborhoodCount}`)
}

function getRandomFeatures(type: string): string[] {
  const allFeatures = ['CCTV', '통학차량', '텃밭', '수영장', '체육관', '도서관', '숲체험', '영어수업', '급식', '연장보육', '방과후', '특별활동']
  const baseFeatures = ['CCTV', '급식']
  const extra = type === '국공립'
    ? ['연장보육', '통학차량', '텃밭']
    : type === '직장'
      ? ['연장보육', '방과후']
      : allFeatures.filter(() => Math.random() > 0.7)
  return [...new Set([...baseFeatures, ...extra])].slice(0, 6)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
