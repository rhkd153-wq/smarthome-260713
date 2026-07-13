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
      { id: 'name', label: '이름', type: 'text', placeholder: '이름' },
      { id: 'age', label: '나이', type: 'number', suffix: '세', placeholder: '나이' },
      { id: 'disabilityType', label: '장애 유형', type: 'text', placeholder: '예) 지체, 뇌병변 등' },
      {
        id: 'disabilityLevel', label: '장애 정도', type: 'choice',
        options: [
          { value: 'severe', label: '심한' },
          { value: 'mild', label: '심하지 않은' }
        ]
      },
      {
        id: 'indoorMobility', label: '실내 보행', type: 'choice',
        options: [
          { value: 'good', label: '잘함 (보조기기 사용 포함)' },
          { value: 'assisted', label: '어려움 · 도움' },
          { value: 'unable', label: '못함' }
        ]
      },
      {
        id: 'handUse', label: '손의 기능적 사용', type: 'choice',
        options: [
          { value: 'operate', label: '리모컨 · 스마트폰 조작' },
          { value: 'fixed', label: '고정된 경우 조작 가능' },
          { value: 'unable', label: '못함' }
        ]
      },
      {
        id: 'communication', label: '대화 가능 여부', type: 'choice',
        options: [
          { value: 'good', label: '잘함' },
          { value: 'unclear', label: '발음 부정확' },
          { value: 'unable', label: '못함' }
        ]
      },
      {
        id: 'discomfort', label: '생활불편 인식 여부', type: 'choice',
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
        id: 'smartphone', label: '스마트폰', type: 'choice',
        options: [
          { value: 'yes', label: '있음' },
          { value: 'no', label: '없음' }
        ]
      },
      {
        id: 'os', label: '스마트폰 사용시 OS', type: 'choice',
        options: [
          { value: 'android', label: '안드로이드' },
          { value: 'ios', label: 'iOS (애플)' },
          { value: 'none', label: '없음' }
        ]
      },
      {
        id: 'wifi', label: 'Wi-Fi', type: 'choice',
        options: [
          { value: 'yes', label: '있음' },
          { value: 'no', label: '없음' }
        ]
      },
      {
        id: 'household', label: '가구 형태', type: 'choice',
        options: [
          { value: 'alone', label: '독거' },
          { value: 'couple', label: '부부만 거주' },
          { value: 'other', label: '그 외' }
        ]
      },
      {
        id: 'housing', label: '주거 형태', type: 'choice',
        options: [
          { value: 'detached', label: '단독 주택' },
          { value: 'apartment', label: '아파트' },
          { value: 'other', label: '그 외' }
        ]
      },
      {
        id: 'controlPanel', label: '통합 주택 제어판 기능 (있을 때)', type: 'multi',
        options: [
          { value: 'light', label: '조명 제어' },
          { value: 'heating', label: '난방 제어' },
          { value: 'elevator', label: '엘리베이터 호출' }
        ]
      },
      {
        id: 'iotExperience', label: 'IoT 사용 경험', type: 'choice',
        options: [
          { value: 'using', label: '사용중' },
          { value: 'tried', label: '경험만 있음' },
          { value: 'none', label: '없음' }
        ]
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
    bigswitch: '큰 스위치',
    robot: '스위치 로봇',
    automation: '자동화 시나리오 · 센서 기반'
  };

  // 플랫폼 힌트 (OS 기반)
  var platformHint = {
    android: 'Google Home · SmartThings 계열',
    ios: 'Apple 홈 · Siri 계열',
    none: '스마트폰 미보유 — 스마트 스피커·전용 리모컨 기반 검토'
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
      { value: 0, short: '미경험', label: '미경험 (수행 경험 없음)', limited: false },
      { value: 1, short: '1', label: '1 · 못함 / 안함', limited: true },
      { value: 2, short: '2', label: '2 · 도움받아 함 (보조기기 사용 포함)', limited: true },
      { value: 3, short: '3', label: '3 · 독립적으로 수행함', limited: false }
    ]
  };

  return {
    currentActivityLevel: currentActivityLevel,
    personalAbility: personalAbility,
    environment: environment,
    spaces: spaces,
    performanceScale: performanceScale,
    controlInterfaces: controlInterfaces,
    platformHint: platformHint,
    deviceTier: deviceTier,
    kitLevels: kitLevels,
    activityCategoryById: activityCategoryById,
    needCategoryMap: needCategoryMap
  };
})();
