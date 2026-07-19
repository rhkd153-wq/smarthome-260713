/*
 * 스마트 홈 가정 환경 수정 프로그램 - 도메인 데이터 모델
 *
 * 출처: 문광태 외(2023~2025) 스마트 홈 가정 환경 수정 프로그램 매뉴얼 / 강의록
 *  - 양식지 1 (부록 4): 초기 체크리스트 (기초 스크리닝)
 *  - 양식지 2 (부록 5): 공간별 작업수행도
 *  - 양식지 3 (부록 6): 적정 스마트 홈 기술 목록
 *
 * 이 파일은 앱 전체가 참조하는 "단일 진실 공급원(single source of truth)" 입니다.
 * 양식지 내용이 바뀌면 이 파일만 수정하면 됩니다.
 */

window.SHData = (function () {
  'use strict';

  /* =========================================================
   * 양식지 1 : 기초 스크리닝 (초기 체크리스트)
   * =======================================================*/

  // (1) 현재 활동 수준 — 앱에서 "가장 먼저" 묻는 항목
  //     응답: 스스로 함 / 도움받아 함 / 안함·해본 적 없음
  var currentActivityLevel = {
    id: 'currentActivity',
    title: '현재 활동 수준',
    guide: '현재 집에서 각 활동을 어떻게 수행하고 있는지 공간별로 선택하세요.',
    options: [
      { value: 'self', label: '스스로 함' },
      { value: 'assisted', label: '도움받아 함' },
      { value: 'none', label: '안함 · 해본 적 없음' }
    ],
    // 공간별로 물어봄. '도움받아 함' 또는 '안함'인 항목은 다음 단계(주요구 확인) 대상이 됨
    groups: [
      {
        space: '현관', items: [
          { id: 'door', label: '현관문 여닫기' },
          { id: 'lock', label: '잠금장치 해제' },
          { id: 'bell', label: '초인종 확인' }
        ]
      },
      {
        space: '거실 / 부엌', items: [
          { id: 'light', label: '조명 제어' },
          { id: 'appliance', label: '가전제품 사용' }
        ]
      },
      {
        space: '침실', items: [
          { id: 'curtain', label: '커튼 / 블라인드 여닫기' }
        ]
      }
    ]
  };

  // (2) 개인 능력
  var personalAbility = {
    id: 'personal',
    title: '개인 능력',
    fields: [
      { id: 'name', label: '이름', type: 'text', placeholder: '이름', q: '사용자의 이름을 알려주세요.' },
      {
        id: 'age', label: '나이 (연령대)', type: 'choice', q: '연령대가 어떻게 되세요?',
        options: [
          { value: 'u20', label: '20대 이하' },
          { value: '30', label: '30대' },
          { value: '4050', label: '40~50대' },
          { value: '60', label: '60대' },
          { value: '70', label: '70대' },
          { value: '80', label: '80대 이상' }
        ]
      },
      {
        id: 'disabilityType', label: '장애 유형', type: 'choice', q: '장애 유형은 무엇인가요?',
        otherField: 'disabilityTypeEtc',
        options: [
          { value: 'physical', label: '지체' },
          { value: 'brain', label: '뇌병변' },
          { value: 'visual', label: '시각' },
          { value: 'hearing', label: '청각' },
          { value: 'developmental', label: '발달' },
          { value: 'mental', label: '정신' },
          { value: 'etc', label: '기타' }
        ]
      },
      {
        id: 'disabilityLevel', label: '장애 정도', type: 'choice', q: '장애 정도는 어떤가요?',
        options: [
          { value: 'severe', label: '심한' },
          { value: 'mild', label: '심하지 않은' }
        ]
      },
      {
        id: 'indoorMobility', label: '실내 보행', type: 'choice', q: '집 안에서 이동은 어떻게 하세요?',
        options: [
          { value: 'good', label: '잘함 (보조기기 사용 포함)' },
          { value: 'assisted', label: '어려움 · 도움' },
          { value: 'unable', label: '못함' }
        ]
      },
      {
        id: 'handUse', label: '손의 기능적 사용', type: 'choice', q: '손으로 리모컨·스마트폰 조작은 어떠세요?',
        options: [
          { value: 'operate', label: '리모컨 · 스마트폰 조작' },
          { value: 'fixed', label: '고정된 경우 조작 가능' },
          { value: 'unable', label: '못함' }
        ]
      },
      {
        id: 'communication', label: '대화 가능 여부', type: 'choice', q: '대화(발화)는 어떠세요?',
        options: [
          { value: 'good', label: '잘함' },
          { value: 'unclear', label: '발음 부정확' },
          { value: 'unable', label: '못함' }
        ]
      },
      {
        id: 'discomfort', label: '생활불편 인식 여부', type: 'choice', q: '지금 생활에서 불편함을 느끼세요?',
        options: [
          { value: 'yes', label: '불편함' },
          { value: 'no', label: '없음' }
        ]
      }
    ]
  };

  // (3) 환경 평가
  var environment = {
    id: 'environment',
    title: '환경 평가',
    fields: [
      {
        id: 'smartphone', label: '스마트폰', type: 'choice', q: '스마트폰을 사용하세요?',
        options: [
          { value: 'yes', label: '있음' },
          { value: 'no', label: '없음' }
        ]
      },
      {
        id: 'os', label: '스마트폰 사용시 OS', type: 'choice', q: '어떤 스마트폰을 쓰세요?',
        options: [
          { value: 'android', label: '안드로이드' },
          { value: 'ios', label: '애플(아이폰)' }
        ]
      },
      {
        id: 'wifi', label: 'Wi-Fi', type: 'choice', q: '집에 Wi-Fi(인터넷)가 있나요?',
        options: [
          { value: 'yes', label: '있음' },
          { value: 'no', label: '없음' }
        ]
      },
      {
        id: 'household', label: '가구 형태', type: 'choice', q: '가구 형태는 어떻게 되세요?',
        options: [
          { value: 'alone', label: '독거' },
          { value: 'couple', label: '부부만 거주' },
          { value: 'other', label: '그 외' }
        ]
      },
      {
        id: 'housing', label: '주거 형태', type: 'choice', q: '어떤 집에 사세요?',
        options: [
          { value: 'detached', label: '단독 주택' },
          { value: 'apartment', label: '아파트' },
          { value: 'other', label: '그 외' }
        ]
      },
      {
        id: 'controlPanel', label: '통합 주택 제어판 기능 (있을 때)', type: 'multi', q: '집에 통합 제어판이 있다면 어떤 기능이 있나요? (여러 개 선택)',
        options: [
          { value: 'light', label: '조명 제어' },
          { value: 'heating', label: '난방 제어' },
          { value: 'elevator', label: '엘리베이터 호출' }
        ]
      },
      {
        id: 'iotExperience', label: 'IoT 사용 경험', type: 'choice', q: '스마트 기기(IoT)를 써보신 적 있나요?',
        options: [
          { value: 'using', label: '사용중' },
          { value: 'tried', label: '경험만 있음' },
          { value: 'none', label: '없음' }
        ]
      },
      {
        id: 'ecosystem', label: '보유 브랜드 · 생태계 (해당 시)', type: 'multi', q: '어떤 브랜드 가전·기기를 갖고 계세요? (여러 개 선택)',
        options: [
          { value: 'samsung', label: '삼성 가전' },
          { value: 'lg', label: 'LG 가전' },
          { value: 'apple', label: '애플 기기' },
          { value: 'kt', label: 'KT (인터넷·기가지니)' },
          { value: 'google', label: '구글' },
          { value: 'etc', label: '기타' }
        ]
      },
      {
        id: 'appliancesText', label: '현재 사용 중인 가전·스마트 기기 (기입)', type: 'text', q: '지금 쓰는 가전·스마트 기기가 있으면 적어주세요.',
        placeholder: '예) 스마트 TV, 에어컨, 로봇청소기, AI 스피커 등'
      }
    ]
  };

  /* =========================================================
   * 양식지 2 & 3 : 공간 → 작업 → 활동 → 적정 스마트 홈 기술
   *
   * 각 활동(activity)은 다음을 가진다.
   *  - id, label
   *  - tech: 적정 스마트 홈 기술 후보 (양식지 3)
   *      각 후보 { network: 'Wi-Fi' | 'BLE', devices: [ ... ] }
   *
   * 수행도(양식지 2): 1-못함/안함, 2-도움받아함, 3-독립적으로 수행함
   *  → 1 또는 2 로 평가된 활동 = "제한되는 활동" → 솔루션 추천 대상
   * =======================================================*/

  var spaces = [
    {
      id: 'entrance',
      label: '현관',
      tasks: [
        {
          id: 'entrance-out',
          label: '외출하기 / 집에 들어가기',
          activities: [
            {
              id: 'unlock', label: '잠금장치 해제',
              tech: [
                { network: 'BLE', devices: ['스위치 로봇'] },
                { network: 'Wi-Fi', devices: ['스마트 잠금장치', '스마트 허브'] }
              ]
            },
            {
              id: 'door', label: '현관문 열기 · 닫기',
              tech: [{ network: 'Wi-Fi', devices: ['스윙식 자동문', '스마트 플러그'] }]
            },
            {
              id: 'security', label: '보안 시스템 활성화',
              tech: [{ network: 'Wi-Fi', devices: ['스마트 카메라', '문 센서'] }]
            },
            {
              id: 'shoes', label: '신발 신기 · 벗기',
              // 로우테크 환경수정이 주 솔루션인 활동(스마트 홈 기기 없음)
              tech: []
            }
          ]
        },
        {
          id: 'entrance-guest',
          label: '손님 / 택배 응대',
          activities: [
            {
              id: 'bell', label: '초인종 확인',
              tech: [{ network: 'Wi-Fi', devices: ['스마트 초인종'] }]
            },
            {
              id: 'unlock', label: '잠금장치 해제',
              tech: [
                { network: 'BLE', devices: ['스위치 로봇'] },
                { network: 'Wi-Fi', devices: ['스마트 잠금장치', '스마트 허브'] }
              ]
            },
            {
              id: 'door', label: '현관문 열기 · 닫기',
              tech: [{ network: 'Wi-Fi', devices: ['스윙식 자동문', '스마트 플러그'] }]
            }
          ]
        }
      ]
    },
    {
      id: 'bedroom',
      label: '침실',
      tasks: [
        {
          id: 'bedroom-sleep',
          label: '잠에서 깨어나기 / 잠자기',
          activities: [
            {
              id: 'moodlight', label: '부드러운 조명 켜기 · 끄기',
              tech: [{ network: 'Wi-Fi', devices: ['스마트 무드등'] }]
            },
            {
              id: 'lightswitch', label: '조명 스위치 켜기 · 끄기',
              tech: [
                { network: 'BLE', devices: ['스위치 로봇'] },
                { network: 'Wi-Fi', devices: ['스마트 스위치', '스마트 허브'] }
              ]
            },
            {
              id: 'curtain', label: '커튼 / 블라인드 여닫기',
              tech: [{ network: 'Wi-Fi', devices: ['스마트 커튼/블라인드', '조도센서'] }]
            },
            {
              id: 'poweroff', label: '모든 전자기기 전원 제어',
              tech: [{ network: 'Wi-Fi', devices: ['스마트 플러그', '스마트 리모컨 허브'] }]
            }
          ]
        },
        {
          id: 'bedroom-night',
          label: '야간 이동하기',
          activities: [
            {
              id: 'lightswitch', label: '조명 스위치 켜기 · 끄기',
              tech: [{ network: 'Wi-Fi', devices: ['스마트 스위치', '스마트 허브'] }]
            },
            {
              id: 'moodlight', label: '부드러운 조명 켜기 · 끄기',
              tech: [{ network: 'Wi-Fi', devices: ['스마트 무드등', '동작 감지기'] }]
            }
          ]
        },
        {
          id: 'bedroom-time',
          label: '시간 보내기',
          activities: [
            {
              id: 'humidity', label: '적정 습도 맞추기',
              tech: [{ network: 'Wi-Fi', devices: ['스마트 가습기', '온습도 센서'] }]
            },
            {
              id: 'fanheater', label: '선풍기 / 온열기 켜기 · 끄기',
              tech: [{ network: 'Wi-Fi', devices: ['스마트 플러그'] }]
            },
            {
              id: 'heating', label: '난방 켜기 · 끄기',
              tech: [{ network: 'BLE', devices: ['스위치 로봇'] }]
            },
            {
              id: 'bed', label: '전동침대 체위 변경',
              tech: [{ network: 'BLE', devices: ['스위치 로봇'] }]
            },
            {
              id: 'airquality', label: '실시간 공기질 모니터링',
              tech: [{ network: 'Wi-Fi', devices: ['스마트 에어컨', '스마트 공기청정기'] }]
            },
            {
              id: 'alert', label: '시스템 상황 알림',
              tech: [{ network: 'Wi-Fi', devices: ['스마트 사이렌', '스마트 무드등'] }]
            },
            {
              id: 'lightswitch', label: '조명 스위치 켜기 · 끄기',
              tech: [
                { network: 'BLE', devices: ['스위치 로봇'] },
                { network: 'Wi-Fi', devices: ['스마트 스위치', '스마트 허브'] }
              ]
            }
          ]
        }
      ]
    },
    {
      id: 'living',
      label: '거실 / 부엌',
      tasks: [
        {
          id: 'living-time',
          label: '시간 보내기',
          activities: [
            {
              id: 'tvac', label: 'TV / 에어컨 제어',
              tech: [{ network: 'Wi-Fi', devices: ['스마트 리모컨 허브'] }]
            },
            {
              id: 'tempHumidity', label: '실시간 온습도 제어',
              tech: [{ network: 'Wi-Fi', devices: ['스마트 에어컨', '스마트 가습기', '온습도 센서', '스마트 허브'] }]
            },
            {
              id: 'curtain', label: '커튼 / 블라인드 여닫기',
              tech: [{ network: 'Wi-Fi', devices: ['스마트 커튼/블라인드', '조도센서'] }]
            },
            {
              id: 'lightswitch', label: '조명 스위치 켜기 · 끄기',
              tech: [
                { network: 'BLE', devices: ['스위치 로봇'] },
                { network: 'Wi-Fi', devices: ['스마트 허브', '스마트 스위치'] }
              ]
            }
          ]
        },
        {
          id: 'living-health',
          label: '건강 관리',
          activities: [
            {
              id: 'weight', label: '체중 체크하기',
              tech: [{ network: 'Wi-Fi', devices: ['스마트 체중계'] }]
            },
            {
              id: 'exercise', label: '운동 공간 조명 및 환기',
              tech: [{ network: 'Wi-Fi', devices: ['스마트 허브', '스마트 스위치'] }]
            },
            {
              id: 'heartrate', label: '심장 박동수 모니터링',
              tech: [{ network: 'BLE', devices: ['웨어러블 디바이스'] }]
            }
          ]
        },
        {
          id: 'living-pet',
          label: '애완동물 관리',
          activities: [
            {
              id: 'petmonitor', label: '애완동물 모니터링',
              tech: [{ network: 'Wi-Fi', devices: ['스마트 카메라'] }]
            },
            {
              id: 'petfeed', label: '애완동물 먹이 주기',
              tech: [{ network: 'Wi-Fi', devices: ['스마트 펫 음식조절기'] }]
            }
          ]
        }
      ]
    },
    {
      id: 'bathroom',
      label: '화장실',
      tasks: [
        {
          id: 'bathroom-hygiene',
          label: '개인위생',
          activities: [
            {
              id: 'lightswitch', label: '조명 스위치 켜기 · 끄기',
              tech: [{ network: 'Wi-Fi', devices: ['스마트 스위치', '스마트 허브', '동작 감지기'] }]
            }
          ]
        },
        {
          id: 'bathroom-manage',
          label: '화장실 관리',
          activities: [
            {
              id: 'humidity', label: '실시간 온습도 모니터링',
              tech: [{ network: 'Wi-Fi', devices: ['온습도 센서', '스마트 허브'] }]
            },
            {
              id: 'fan', label: '환풍기 켜기 · 끄기',
              tech: [{ network: 'Wi-Fi', devices: ['스마트 플러그', '온습도 센서'] }]
            }
          ]
        }
      ]
    }
  ];

  /* =========================================================
   * 제어 인터페이스 (양식지 3: 22항목 중 "제어 인터페이스")
   *  - 개인 능력에 따라 권장 제어 방식을 도출하는 데 사용
   * =======================================================*/
  var controlInterfaces = {
    touchscreen: '터치스크린 (스마트폰 앱)',
    speaker: '스마트 스피커 (음성)',
    remote: '리모컨',
    fixedRemote: '고정형(거치형) 리모컨',
    bigswitch: '큰 스위치',
    robot: '스위치 로봇',
    aac: 'AAC 앱 (보완대체의사소통)',
    automation: '자동화 시나리오 · 센서 기반'
  };

  // 플랫폼 힌트 (OS 기반)
  var platformHint = {
    android: 'Google Home · SmartThings 계열',
    ios: 'Apple 홈 · Siri 계열',
    none: '스마트폰 미보유 — 스마트 스피커·전용 리모컨 기반 검토'
  };

  /* =========================================================
   * 권장 플랫폼 (강의록: SmartThings·LG ThinQ·Hejhome·GigaGenie 등)
   *  - 개인/환경(OS·보유 브랜드)에 따라 추천 우선순위를 정함
   * =======================================================*/
  var platforms = {
    smartthings: { name: 'SmartThings', desc: '삼성 가전·안드로이드와 잘 맞고 Matter 지원 폭이 넓어 확장에 유리' },
    thinq:       { name: 'LG ThinQ', desc: 'LG 가전을 보유·활용할 때' },
    apple:       { name: 'Apple 홈 (HomeKit)', desc: '아이폰·아이패드 등 애플 기기 사용 시' },
    google:      { name: 'Google Home', desc: '안드로이드·구글 어시스턴트 기반' },
    hejhome:     { name: 'Hej Home (헤이홈)', desc: '국내 보급형, 다양한 저가 기기로 초기 구성에 부담이 적음' },
    gigagenie:   { name: 'KT GiGA Genie (기가지니)', desc: 'KT 인터넷·음성 스피커를 쓰는 경우' }
  };

  /* =========================================================
   * 키트 구성 (강의록 34p: 초보자 키트 / 숙련자 키트)
   *  - 기기를 설치 난이도에 따라 두 등급으로 분류
   *    · beginner: 플러그앤플레이 (설정 간단, 별도 배선/설치 최소)
   *    · advanced: 허브·센서·자동화 기반 (설치·연동 필요)
   * =======================================================*/
  var deviceTier = {
    // 초보자 키트 (플러그앤플레이)
    '스마트 플러그': 'beginner',
    '스마트 리모컨 허브': 'beginner',
    '스마트 스피커': 'beginner',
    '스위치 로봇': 'beginner',
    '스마트 무드등': 'beginner',
    '스마트 초인종': 'beginner',
    '스마트 카메라': 'beginner',
    '웨어러블 디바이스': 'beginner',
    '스마트 체중계': 'beginner',
    '스마트 펫 음식조절기': 'beginner',
    '스마트 사이렌': 'beginner',
    '스마트 에어컨': 'beginner',
    '스마트 공기청정기': 'beginner',
    '스마트 가습기': 'beginner',
    // 숙련자 키트 (허브·센서·자동화)
    '스마트 허브': 'advanced',
    '스마트 스위치': 'advanced',
    '스마트 잠금장치': 'advanced',
    '스마트 커튼/블라인드': 'advanced',
    '조도센서': 'advanced',
    '온습도 센서': 'advanced',
    '동작 감지기': 'advanced',
    '문 센서': 'advanced',
    '스윙식 자동문': 'advanced'
  };

  /* =========================================================
   * 기기별 연결 방식 (구매·자동화 설정 안내용)
   *  - wifi      : 공유기에 직접 연결 (허브 불필요)
   *  - hub_zigbee: 저전력 무선(Zigbee/Thread) → 스마트 허브 필요
   *  - smarthub  : 스마트 허브 장치 자체
   *  - ir        : 리모컨 허브(적외선) — TV·에어컨 등 기존 리모컨 가전 제어
   *  - ble       : 블루투스 근거리 (원격·자동화하려면 허브 권장)
   * =======================================================*/
  var deviceConnectivity = {
    '스마트 허브': 'smarthub',
    '스마트 리모컨 허브': 'ir',
    '스위치 로봇': 'ble',
    '웨어러블 디바이스': 'ble',
    '스마트 잠금장치': 'hub_zigbee',
    '스마트 커튼/블라인드': 'hub_zigbee',
    '조도센서': 'hub_zigbee',
    '온습도 센서': 'hub_zigbee',
    '동작 감지기': 'hub_zigbee',
    '문 센서': 'hub_zigbee',
    '스마트 사이렌': 'hub_zigbee',
    '스마트 스위치': 'hub_zigbee',
    '스마트 무드등': 'wifi',
    '스마트 플러그': 'wifi',
    '스마트 카메라': 'wifi',
    '스마트 초인종': 'wifi',
    '스마트 에어컨': 'wifi',
    '스마트 가습기': 'wifi',
    '스마트 공기청정기': 'wifi',
    '스마트 체중계': 'wifi',
    '스마트 펫 음식조절기': 'wifi',
    '스윙식 자동문': 'wifi'
  };
  // 연결 방식 그룹 설명
  var connectivityInfo = {
    wifi: {
      icon: '🛜', label: 'Wi-Fi 직접 연결', needsHub: false,
      desc: '집 공유기(Wi-Fi)에 바로 연결됩니다. 별도 허브 없이 각 제조사 앱이나 플랫폼으로 제어할 수 있어요.'
    },
    smarthub: {
      icon: '🧩', label: '스마트 허브 (Zigbee·Thread·Matter)', needsHub: true,
      desc: '센서·잠금장치·스위치 같은 저전력 무선 기기를 하나로 묶어 인터넷에 연결하는 중심 장치입니다. 이 허브가 있어야 해당 기기들이 연결되고 자동화가 됩니다. Matter/Thread를 지원하면 여러 브랜드를 함께 쓰기 쉽습니다.'
    },
    ir: {
      icon: '📡', label: '리모컨 허브 (적외선 IR)', needsHub: true,
      desc: 'TV·에어컨처럼 리모컨으로 켜던 가전을 대신 조작합니다. 적외선(IR) 신호를 쏘는 장치로, 스마트 허브와는 역할이 다릅니다. (별도 장치)'
    },
    ble: {
      icon: '🔵', label: 'BLE 근거리(블루투스)', needsHub: false,
      desc: '가까운 거리에서 스마트폰과 직접 연결됩니다. 외출 중 원격 제어하거나 자동화하려면 허브(브릿지)를 함께 두는 것이 좋습니다.'
    }
  };

  var kitLevels = {
    beginner: {
      key: 'beginner',
      title: '초보자 키트',
      desc: '설정이 간단한 플러그앤플레이 기기 중심 구성입니다. IoT 사용 경험이 적거나 디지털 리터러시 지원이 필요한 대상자에게 우선 권장합니다.'
    },
    advanced: {
      key: 'advanced',
      title: '숙련자 키트',
      desc: '허브·센서·자동화 시나리오를 포함한 확장 구성입니다. IoT 사용 경험이 있고 다양한 기기 연동을 원하는 대상자에게 권장합니다.'
    }
  };

  /* =========================================================
   * 주요구 ↔ 공간별 활동 연결 (옵션 B: 주요구 중심 필터링)
   *  - 활동 id는 의미별로 일관되므로 id → 카테고리 매핑으로 처리
   *  - 현재 활동 수준(주요구) 항목 → 관련 카테고리
   * =======================================================*/
  var activityCategoryById = {
    unlock: 'lock', door: 'door', security: 'security', bell: 'bell',
    moodlight: 'light', lightswitch: 'light', curtain: 'curtain', poweroff: 'appliance',
    humidity: 'humidity', fanheater: 'climate', heating: 'climate', bed: 'posture',
    airquality: 'airquality', alert: 'security',
    tvac: 'appliance', tempHumidity: 'climate', weight: 'health', exercise: 'light',
    heartrate: 'health', petmonitor: 'pet', petfeed: 'pet', fan: 'climate'
  };
  // 주요구(현재 활동 수준 항목) → 필터에 포함할 카테고리
  var needCategoryMap = {
    door: ['door'],
    lock: ['lock'],
    bell: ['bell', 'security'],
    light: ['light'],
    curtain: ['curtain'],
    appliance: ['appliance', 'climate']
  };

  // 수행도 척도 (양식지 2)
  var performanceScale = {
    guide: '현재 수행 정도를 아래 기준에 따라 선택하세요. 수행 경험이 없으면 "미경험"을 선택합니다.',
    options: [
      { value: 0, word: '미경험', short: '미경험', label: '미경험 (수행 경험 없음)', limited: false },
      { value: 1, word: '못함·안함', short: '1', label: '못함 / 안함', limited: true },
      { value: 2, word: '도움받아 함', short: '2', label: '도움받아 함 (보조기기 사용 포함)', limited: true },
      { value: 3, word: '독립적으로 함', short: '3', label: '독립적으로 수행함', limited: false }
    ]
  };

  /* =========================================================
   * 작업수행 분석 (Occupational Performance Analysis)
   *  근거: OTPF-4 (AOTA, 2020)
   *   - Table 7 수행기술(Performance Skills): 효과적/비효과적 수행
   *   - Table 9 클라이언트 요인(Client Factors) 중 신체기능(Body Functions)
   *
   *  핵심 원리(OTPF-4): "수행기술을 비효과적으로 사용하는 대상자라도,
   *  작업적·환경적 적응(adaptation)을 사용하면 전체 작업을 성공적으로
   *  수행할 수 있다." → 우리 솔루션(스마트 홈 + 로우테크)은 바로 이
   *  '환경적 적응'으로, 막힌 수행기술을 제거하거나 대체한다.
   * =======================================================*/
  var otpfPrinciple =
    '작업수행 분석은 활동을 정상 수행 단계로 나누고, 각 단계에 필요한 수행기술·신체기능을 확인한 뒤, ' +
    '대상자의 손상으로 인해 어느 단계가 막히는지를 찾습니다. 그 막힌 수행기술을 스마트 홈 기기(동작 제거·인터페이스 대체) 또는 ' +
    '로우테크 환경수정(물리적 보완)으로 없애거나 대체하여 대상자가 스스로 작업을 완수하도록 돕습니다. ' +
    '근거: OTPF-4 (미국작업치료협회, 2020) — 수행기술(Table 7)·신체기능(Table 9).';

  // 우리 앱에서 쓰는 수행기술 어휘(한글) — OTPF-4 운동 수행기술 기반
  var performanceSkillRef = [
    { name: '뻗기', desc: '팔을 뻗어 멀리 있는 물건을 잡거나 스위치에 닿기', effective: '힘들이지 않고 자연스럽게 팔을 뻗음', ineffective: '과도한 노력으로 뻗거나 닿지 못함' },
    { name: '굽히기', desc: '앉거나 낮은 곳의 물건을 잡기 위해 몸통을 굽히기', effective: '무리 없이 굽혀 물건에 닿음', ineffective: '뻣뻣하거나 굽히지 못해 닿지 못함' },
    { name: '쥐기·집기', desc: '물건이 미끄러지지 않게 쥐거나 손끝으로 집기', effective: '물건이 손에서 미끄러지지 않음', ineffective: '쥐지 못해 물건이 미끄러지거나 떨어짐' },
    { name: '쥐고 돌리기', desc: '손잡이·다이얼을 쥐고 손목을 돌리기', effective: '손목을 돌려 손잡이를 조작함', ineffective: '손목 회전이 어려워 손잡이를 돌리지 못함' },
    { name: '조작하기', desc: '손가락으로 버튼·작은 물건을 정교하게 다루기', effective: '더듬지 않고 버튼·부품을 다룸', ineffective: '더듬거나 헛눌러 정확히 조작하지 못함' },
    { name: '협응하기', desc: '두 손·팔을 함께 사용해 물건을 다루기', effective: '양손을 함께 안정적으로 사용함', ineffective: '양손 협응이 안 되어 물건을 놓침' },
    { name: '밀기·당기기', desc: '문·서랍·커튼을 밀거나 당기기', effective: '적은 힘으로 부드럽게 밀고 당김', ineffective: '과도한 힘이 들거나 밀고 당기지 못함' },
    { name: '들어올리기', desc: '물건을 들어 올리기', effective: '무리 없이 들어 올림', ineffective: '가벼운 물건도 들어 올리기 어려움' },
    { name: '걷기', desc: '실내 바닥을 안정적으로 이동하기', effective: '끌지 않고 안정적으로 걸음', ineffective: '불안정하거나 지지 없이는 걷지 못함' },
    { name: '옮기기·이동', desc: '물건을 들고, 또는 휠체어로 자리 옮기기', effective: '안정적으로 옮김', ineffective: '옮기는 동안 불안정함' },
    { name: '힘 조절', desc: '알맞은 힘·속도로 물건을 다루기', effective: '적절한 힘으로 조작함', ineffective: '힘이 너무 세거나 약함' },
    { name: '부드러운 움직임', desc: '팔·손목을 부드럽게 움직이기', effective: '부드럽고 유연하게 움직임', ineffective: '뻣뻣하고 끊기게 움직임' },
    { name: '자세 유지', desc: '작업 중 균형을 잃지 않고 자세 잡기', effective: '기대거나 짚지 않고 자세를 유지함', ineffective: '계속 기대거나 균형을 잃음' },
    { name: '지구력', desc: '쉬지 않고 작업을 끝까지 지속하기', effective: '피로 없이 작업을 마침', ineffective: '중간에 쉬거나 숨차서 멈춤' },
    { name: '말하기·의사소통', desc: '음성으로 요구·의사를 전달하기', effective: '명료하게 말해 의사를 전달함', ineffective: '발음이 부정확해 음성 인식·전달이 어려움' }
  ];

  // 신체기능(OTPF-4 Table 9 · 신경근골격 및 운동 관련 기능 중심)
  var bodyFunctionRef = [
    { name: '관절가동범위', desc: '관절을 움직일 수 있는 범위 (손목·어깨·고관절 등)' },
    { name: '근력', desc: '움직임을 만들어내는 힘' },
    { name: '근긴장', desc: '근육의 긴장도 (경직·이완·변동)' },
    { name: '근지구력', desc: '근육 수축을 지속하는 능력' },
    { name: '정밀 운동 조절', desc: '손가락의 소근육 협응 (버튼·작은 물건)' },
    { name: '보행 패턴', desc: '걷기와 이동의 안정성' },
    { name: '균형·자세 반응', desc: '넘어지지 않도록 자세를 잡는 반응' },
    { name: '음성·조음 기능', desc: '말소리를 명료하게 산출하는 기능' }
  ];

  /* 개인 능력(personal) → 막히기 쉬운 수행기술 추론 규칙(자동, 평가자 보정 가능)
   *  값: state.personal 의 각 필드 값 → 막힌 수행기술(한글) 배열 */
  var blockedSkillRules = {
    handUse: {
      fixed:  ['쥐고 돌리기', '조작하기', '협응하기', '힘 조절'],
      unable: ['쥐기·집기', '쥐고 돌리기', '조작하기', '협응하기', '밀기·당기기', '들어올리기', '힘 조절', '부드러운 움직임']
    },
    indoorMobility: {
      assisted: ['걷기', '자세 유지'],
      unable:   ['걷기', '옮기기·이동', '자세 유지', '뻗기']
    },
    communication: {
      unclear: ['말하기·의사소통'],
      unable:  ['말하기·의사소통']
    }
  };

  /* 활동별 정상 수행 단계 분해(활동 id 기준, 공간 공통 재사용)
   *  각 step: { label, skills:[수행기술 한글] } */
  var activityAnalysis = {
    shoes: { title: '신발 신기 · 벗기', steps: [
      { label: '현관에서 앉을 자리 잡기', skills: ['자세 유지', '걷기'] },
      { label: '허리를 굽혀 발쪽으로 손 뻗기', skills: ['굽히기', '뻗기'] },
      { label: '신발을 쥐고 발에 신기기', skills: ['쥐기·집기', '밀기·당기기'] }
    ]},
    unlock: { title: '잠금장치 해제', steps: [
      { label: '도어락 앞으로 이동', skills: ['걷기', '옮기기·이동'] },
      { label: '버튼 누르거나 열쇠 조작', skills: ['조작하기', '쥐기·집기'] }
    ]},
    door: { title: '현관문 열기 · 닫기', steps: [
      { label: '손잡이를 쥐고 돌리기', skills: ['쥐고 돌리기', '쥐기·집기'] },
      { label: '문을 밀거나 당기기', skills: ['밀기·당기기', '힘 조절'] },
      { label: '문턱을 넘어 드나들기', skills: ['걷기', '자세 유지'] }
    ]},
    security: { title: '보안 시스템 활성화', steps: [
      { label: '제어판·기기까지 이동', skills: ['걷기'] },
      { label: '버튼·스위치 조작', skills: ['조작하기', '뻗기'] }
    ]},
    bell: { title: '초인종 확인 · 응답', steps: [
      { label: '초인종을 듣고 현관으로 이동', skills: ['걷기'] },
      { label: '화면 확인·응답 버튼 조작', skills: ['조작하기', '뻗기'] }
    ]},
    lightswitch: { title: '조명 스위치 켜기 · 끄기', steps: [
      { label: '스위치까지 이동', skills: ['걷기'] },
      { label: '벽 스위치에 손 뻗기', skills: ['뻗기'] },
      { label: '스위치 누르기', skills: ['쥐기·집기', '힘 조절'] }
    ]},
    moodlight: { title: '부드러운 조명 켜기 · 끄기', steps: [
      { label: '조명·리모컨에 손 뻗기', skills: ['뻗기'] },
      { label: '버튼 조작', skills: ['조작하기'] }
    ]},
    curtain: { title: '커튼 / 블라인드 여닫기', steps: [
      { label: '창가로 이동', skills: ['걷기'] },
      { label: '커튼 줄·천을 쥐고 당기기', skills: ['쥐기·집기', '밀기·당기기', '들어올리기'] }
    ]},
    poweroff: { title: '전자기기 전원 제어', steps: [
      { label: '각 기기·콘센트까지 이동', skills: ['걷기', '옮기기·이동'] },
      { label: '스위치·플러그 조작', skills: ['쥐기·집기', '조작하기'] }
    ]},
    tvac: { title: 'TV / 에어컨 제어', steps: [
      { label: '리모컨을 찾아 쥐기', skills: ['쥐기·집기'] },
      { label: '작은 버튼을 정확히 누르기', skills: ['조작하기', '힘 조절'] }
    ]},
    heating: { title: '난방 켜기 · 끄기', steps: [
      { label: '보일러 조절기까지 이동', skills: ['걷기'] },
      { label: '버튼·다이얼 조작', skills: ['조작하기', '쥐고 돌리기'] }
    ]},
    bed: { title: '전동침대 체위 변경', steps: [
      { label: '리모컨을 쥐기', skills: ['쥐기·집기'] },
      { label: '버튼 누르기', skills: ['조작하기'] }
    ]},
    fan: { title: '환풍기 켜기 · 끄기', steps: [
      { label: '환풍기 스위치까지 이동', skills: ['걷기'] },
      { label: '높은 곳 스위치에 손 뻗기', skills: ['뻗기'] },
      { label: '스위치 누르기', skills: ['쥐기·집기'] }
    ]}
  };

  /* =========================================================
   * 로우테크 환경수정 카탈로그 (현장 추천 항목)
   *  각 항목: { id, name, spaces:[공간 id | '전체'], why, supports:[수행기술] }
   *  supports = 이 항목이 보완·대체해 주는 막힌 수행기술
   * =======================================================*/
  var lowtechCatalog = [
    { id: 'fold-chair', name: '현관 접이식 의자(벤치)', spaces: ['entrance'],
      why: '앉아서 신발을 신어 균형을 잃지 않게 합니다.', supports: ['자세 유지', '굽히기'] },
    { id: 'long-shoehorn', name: '긴 구둣주걱', spaces: ['entrance'],
      why: '허리를 깊이 굽히지 않고 신발을 신을 수 있습니다.', supports: ['굽히기', '뻗기'] },
    { id: 'threshold-ramp', name: '문턱 경사판(미니 램프)', spaces: ['entrance', 'bathroom', 'living'],
      why: '문턱 단차를 없애 휠체어·보행기·지팡이 이동을 안전하게 합니다.', supports: ['걷기', '옮기기·이동', '자세 유지'] },
    { id: 'lever-handle', name: '레버형 문손잡이', spaces: ['entrance', 'bathroom', 'bedroom', 'living'],
      why: '돌리는 손잡이를 아래로 누르는 레버로 바꿔 손목 회전 부담을 없앱니다.', supports: ['쥐고 돌리기', '쥐기·집기'] },
    { id: 'reacher', name: '리처(집게형 도구)', spaces: ['전체'],
      why: '떨어진 물건이나 높은 곳의 물건을 무리 없이 잡습니다.', supports: ['뻗기', '쥐기·집기', '들어올리기'] },
    { id: 'grab-bar', name: '안전 손잡이(그랩바)', spaces: ['bathroom', 'entrance'],
      why: '일어서기·앉기·이동 시 몸을 지지해 낙상을 예방합니다.', supports: ['자세 유지', '걷기'] },
    { id: 'nonslip-mat', name: '미끄럼 방지 매트', spaces: ['bathroom'],
      why: '물기로 미끄러지는 것을 막아 안전하게 이동·기립하게 합니다.', supports: ['걷기', '자세 유지'] },
    { id: 'shower-chair', name: '목욕의자(샤워체어)', spaces: ['bathroom'],
      why: '앉아서 씻어 서 있는 부담과 피로를 줄입니다.', supports: ['자세 유지', '지구력'] },
    { id: 'big-rocker-switch', name: '큰 로커형 스위치판', spaces: ['전체'],
      why: '손끝 대신 손등·팔로도 누를 수 있는 넓은 스위치로 조작을 쉽게 합니다.', supports: ['쥐기·집기', '조작하기', '힘 조절'] },
    { id: 'big-remote', name: '대형 버튼 리모컨 · 버튼 키가드', spaces: ['living', 'bedroom'],
      why: '버튼이 크고 오작동을 줄여 정확히 누를 수 있습니다.', supports: ['조작하기', '쥐기·집기'] },
    { id: 'lower-switch', name: '스위치·콘센트 높이 조정(하향 이설)', spaces: ['전체'],
      why: '앉은 자세·휠체어에서 손이 닿는 높이로 조정합니다.', supports: ['뻗기'] },
    { id: 'nightlight', name: '콘센트형 자동 야간등', spaces: ['bedroom', 'entrance'],
      why: '어두운 밤 스위치를 찾지 않아도 발밑을 밝혀 야간 이동을 안전하게 합니다.', supports: ['걷기'] },
    { id: 'bed-rail', name: '침대 난간 · 기립 보조 손잡이', spaces: ['bedroom'],
      why: '일어나기·돌아눕기 때 잡고 지지할 수 있습니다.', supports: ['자세 유지', '밀기·당기기'] },
    { id: 'curtain-wand', name: '커튼 조작봉 · 고리형 손잡이', spaces: ['living', 'bedroom'],
      why: '줄을 세게 당기지 않고 봉으로 밀어 커튼을 여닫습니다.', supports: ['밀기·당기기', '쥐기·집기'] }
  ];

  return {
    otpfPrinciple: otpfPrinciple,
    performanceSkillRef: performanceSkillRef,
    bodyFunctionRef: bodyFunctionRef,
    blockedSkillRules: blockedSkillRules,
    activityAnalysis: activityAnalysis,
    lowtechCatalog: lowtechCatalog,
    currentActivityLevel: currentActivityLevel,
    personalAbility: personalAbility,
    environment: environment,
    spaces: spaces,
    performanceScale: performanceScale,
    controlInterfaces: controlInterfaces,
    platformHint: platformHint,
    platforms: platforms,
    deviceTier: deviceTier,
    kitLevels: kitLevels,
    deviceConnectivity: deviceConnectivity,
    connectivityInfo: connectivityInfo,
    activityCategoryById: activityCategoryById,
    needCategoryMap: needCategoryMap
  };
})();
