"""Recompute portfolio aggregates from original Olist CSVs. No source rows are exported.
Usage: python evidence/verify_olist.py PATH_TO_RAW_CSV_FOLDER
"""
import csv,json,sys
from pathlib import Path
from collections import Counter,defaultdict
source=Path(sys.argv[1])
def rows(name):
 with (source/name).open(encoding='utf-8-sig',newline='') as stream: return list(csv.DictReader(stream))
orders=rows('olist_orders_dataset.csv');assert len(orders)==len({r['order_id'] for r in orders})
customers={r['customer_id']:r['customer_state'] for r in rows('olist_customers_dataset.csv')}
reviews={}
for row in rows('olist_order_reviews_dataset.csv'):
 key=(row['review_creation_date'],row['review_answer_timestamp'],row['review_id'])
 previous=reviews.get(row['order_id'])
 if previous is None or key>previous[0]: reviews[row['order_id']]=(key,int(row['review_score']))
delivered=[r for r in orders if r['order_status']=='delivered']
eligible=[r for r in delivered if r['order_delivered_customer_date'] and r['order_estimated_delivery_date']]
states=defaultdict(lambda:{'eligible':0,'late':0}); outcomes=defaultdict(lambda:{'eligible':0,'reviewed':0,'low_reviews':0,'score_sum':0})
for row in eligible:
 late=row['order_delivered_customer_date'][:10]>row['order_estimated_delivery_date'][:10]
 state=states[customers[row['customer_id']]];state['eligible']+=1;state['late']+=late
 group=outcomes['late' if late else 'on_time'];group['eligible']+=1
 if row['order_id'] in reviews:
  score=reviews[row['order_id']][1];assert 1<=score<=5
  group['reviewed']+=1;group['low_reviews']+=score<=2;group['score_sum']+=score
for group in outcomes.values():
 group['low_review_rate']=group['low_reviews']/group['reviewed'];group['mean_review']=group['score_sum']/group['reviewed']
for group in states.values():group['late_rate']=group['late']/group['eligible']
result={'dataset':'Olist historical Brazilian e-commerce data, 2016-2018','orders':len(orders),'delivered':len(delivered),'eligible':len(eligible),'excluded_missing_dates':len(delivered)-len(eligible),'late':outcomes['late']['eligible'],'outcomes':dict(outcomes),'states':dict(sorted(states.items()))}
result['late_rate']=result['late']/result['eligible']
result['sp_rj_late_share']=(states['SP']['late']+states['RJ']['late'])/result['late']
output=Path(__file__).with_name('olist-summary.json');output.write_text(json.dumps(result,indent=2),encoding='utf-8')
print(json.dumps({k:v for k,v in result.items() if k!='states'},indent=2))
