(function () {
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function silhouette(formation) {
    if (!formation) return '<span class="train-unknown" aria-hidden="true">?</span>';
    const width = formation.cars === 8 ? 64 : 32;
    const windows = Array.from({ length: formation.cars === 8 ? 7 : 3 }, (_, i) =>
      `<rect x="${5 + i * 7}" y="4" width="4.5" height="4" rx=".8"/>`).join('');
    return `<span class="train-shape" aria-hidden="true"><svg class="train-icon" width="${width * 1.25}" height="20" viewBox="0 0 ${width} 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path class="train-body" d="M3 1.5H${width - 8}Q${width - 5} 1.5 ${width - 3.5} 4.5L${width - 1} 9.5V12H2V4Q2 1.5 3 1.5Z" fill="#f5faff" stroke="currentColor" stroke-width="1"/><g class="train-windows" fill="currentColor">${windows}<path d="M${width - 6} 4L${width - 3.5} 8H${width - 6}Z"/></g><path d="M3 10H${width - 2}" stroke="currentColor" stroke-width="1.4"/><path d="M6 13H${width - 6}" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/><circle cx="7" cy="13" r="1.5" fill="currentColor"/><circle cx="${width - 7}" cy="13" r="1.5" fill="currentColor"/></svg></span>`;
  }
  window.trainUI = {
    badge(t, between, index) {
      const number = t['odpt:trainNumber'] || '?';
      const formation = getTrainFormation(number);
      const delay = delayInfo(t['odpt:delay']);
      const destination = stationName(t['odpt:destinationStation']?.[0]) || '?';
      const description = `列車 ${number}、${destination}、${trainFormationLabel(formation)}、${delay.text}`;
      return `<button type="button" class="train-badge ${formation ? `car-${formation.cars}` : 'car-unknown'} ${delay.cls} ${between ? 'between' : 'at-station'}" style="--train-index:${index}" data-train="${escape(number)}" onclick="showTrainPopup(this.dataset.train,this,event)" aria-label="${escape(description)}" title="${escape(`列車 ${number}、${destination}、${delay.text}`)}">${silhouette(formation)}<span class="destination">${escape(destination)}</span>${delay.cls === 'delay-0' ? '' : `<strong class="delay-value">${escape(delay.text)}</strong>`}</button>`;
    },
    open(t, anchor) {
      const number = t['odpt:trainNumber'] || '−';
      const formation = getTrainFormation(number);
      const delay = delayInfo(t['odpt:delay']);
      const destination = stationName(t['odpt:destinationStation']?.[0]) || '不明';
      const from = stationName(t['odpt:fromStation']) || '位置不明';
      const to = stationName(t['odpt:toStation']);
      const popup = document.getElementById('popup');
      document.getElementById('popupTitle').textContent = `列車 ${number}`;
      document.getElementById('popupType').textContent = '';
      document.getElementById('popupRows').innerHTML = `
        <div class="detail-heading"><h2>${escape(destination)}</h2><span class="${delay.cls} detail-delay">${escape(delay.text)}</span></div>
        <div class="detail-train ${formation ? `car-${formation.cars}` : 'car-unknown'} ${delay.cls}" aria-label="${escape(trainFormationLabel(formation))}">${silhouette(formation)}</div>
        <div class="position-caption">${to ? '走行区間' : '現在位置'}</div>
        <div class="detail-position"><span>${escape(from)}</span>${to ? `<span class="position-arrow">→</span><span>${escape(to)}</span>` : '<span class="stopped-label">停車中</span>'}</div>
        <div class="detail-footer"><span>${formation ? (formation.basis === 'user-specified-route-rule' ? '指定ルールに基づく編成' : '時刻表に基づく編成') : '編成情報なし'}</span><span>${escape(formatTime(t['dc:date'])) || '—'} 更新</span></div>`;
      const overlay = document.getElementById('popupOverlay');
      overlay.classList.add('active');
      overlay.dataset.returnTrain = number;
      if (window.innerWidth > 600) {
        const rect = anchor.getBoundingClientRect();
        const width = popup.offsetWidth, height = popup.offsetHeight;
        popup.style.left = `${Math.max(12, Math.min(rect.left, window.innerWidth - width - 12))}px`;
        popup.style.top = `${Math.max(12, Math.min(rect.bottom + 12, window.innerHeight - height - 12))}px`;
      }
      popup.querySelector('.popup-close').focus();
    }
  };
  document.addEventListener('keydown', event => {
    const overlay = document.getElementById('popupOverlay');
    if (!overlay.classList.contains('active')) return;
    if (event.key === 'Escape') closePopup();
    if (event.key === 'Tab') { event.preventDefault(); document.querySelector('.popup-close').focus(); }
  });
})();
