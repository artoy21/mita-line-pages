(function () {
  let formations = new Map();
  let holidays = null;
  const japanDate = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit', day: '2-digit'
  });

  function calendarFor(date) {
    const parts = Object.fromEntries(japanDate.formatToParts(date).map(p => [p.type, p.value]));
    const key = `${parts.year}-${parts.month}-${parts.day}`;
    const weekday = new Date(`${key}T12:00:00+09:00`).getUTCDay();
    if (weekday === 0 || weekday === 6 || (holidays && holidays[key])) {
      return 'odpt.Calendar:SaturdayHoliday';
    }
    return holidays ? 'odpt.Calendar:Weekday' : null;
  }

  window.loadTrainFormations = async function () {
    const results = await Promise.allSettled([
      fetch('data/official-car-map.json').then(async response => {
        if (!response.ok) throw new Error(`Formation data HTTP ${response.status}`);
        const data = await response.json();
        const next = new Map();
        for (const item of data.trains) {
          if (![6, 8].includes(item.cars)) throw new Error('Invalid car count');
          const key = `${item.calendar}/${item.trainNumber}`;
          if (next.has(key)) throw new Error('Duplicate formation');
          next.set(key, item);
        }
        if (!next.size) throw new Error('Empty formation data');
        formations = next;
      }),
      fetch('https://holidays-jp.github.io/api/v1/date.json').then(async response => {
        if (!response.ok) throw new Error(`Holiday data HTTP ${response.status}`);
        const data = await response.json();
        if (!data || Array.isArray(data) || typeof data !== 'object') throw new Error('Invalid holiday data');
        holidays = data;
      })
    ]);
    return { formationsAvailable: results[0].status === 'fulfilled', holidaysAvailable: results[1].status === 'fulfilled' };
  };

  window.getTrainFormation = function (trainNumber, date = new Date()) {
    const calendar = calendarFor(date);
    return calendar ? formations.get(`${calendar}/${trainNumber}`) || null : null;
  };

  window.trainFormationLabel = function (formation) {
    if (!formation) return '両数不明';
    return `${formation.cars}両（${formation.basis === 'user-specified-route-rule' ? '指定ルール' : '時刻表'}）`;
  };
})();
