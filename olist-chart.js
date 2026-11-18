const chartValues = { low: { title: 'Low-review rate by delivery outcome', scale: 'Scale: 0-100%', max: 100, values: [9.268472658564672, 62.40401191035888], suffix: '%', description: 'Low-review rate among reviewed delivery-eligible orders.' }, score: { title: 'Mean review score by delivery outcome', scale: 'Scale: 0-5', max: 5, values: [4.2902742528761335, 2.2708039492242595], suffix: ' / 5', description: 'Mean review score among reviewed delivery-eligible orders.' } };
function setReviewMetric(metric) {
 const spec = chartValues[metric];
 if (!spec) return;
 document.querySelector('#chart-heading').textContent = spec.title;
 document.querySelector('#chart-scale').textContent = spec.scale;
 document.querySelector('#chart-description').textContent = spec.description;
 ['on-time','late'].forEach((id,index) => {
  document.querySelector('#bar-'+id).style.width = (spec.values[index] / spec.max * 100)+'%';
  document.querySelector('#value-'+id).textContent = spec.values[index].toFixed(2)+spec.suffix;
 });
 document.querySelectorAll('[data-metric]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.metric===metric)));
}
document.querySelectorAll('[data-metric]').forEach(button => button.addEventListener('click', () => setReviewMetric(button.dataset.metric)));
