import numpy as np, csv
codes=[("A",None,3.15),("B",3.15,3.55),("C",3.55,4.0),("D",4.0,4.5),("E",4.5,5.0),
("F",5.0,5.6),("G",5.6,6.3),("H",6.3,7.1),("J",7.1,8.0),("K",8.0,9.0),
("L",9.0,10.0),("M",10.0,11.2),("N",11.2,12.5),("P",12.5,14.0),("R",14.0,16.0),
("S",16.0,18.0),("T",18.0,20.0),("U",20.0,22.4),("V",22.4,None)]
SRC="NEMA MG-1 locked-rotor kVA/hp code letter table"
NOTE="APPROXIMATION - kVA/hp treated as per-unit LRA (assumes full-load kVA/hp ~ 1.0); actual multiple depends on efficiency x PF"
ts=[10000,100,1,0.01,0.001]
rows=[]
for L,lo,hi in codes:
    note=NOTE
    if lo is None: lo=hi; note+="; Code A is open-ended below (<=3.15), lower bound drawn at 3.15"
    if hi is None: hi=lo; note+="; Code V is open-ended above (>=22.4), upper bound drawn at 22.4"
    for t in ts: rows.append((f"FLA - Code {L}","NEMA MG-1",f"Code {L} LRA",t,lo,"min",SRC+f" - Code {L} lower bound",note))
    for t in ts: rows.append((f"FLA - Code {L}","NEMA MG-1",f"Code {L} LRA",t,hi,"max",SRC+f" - Code {L} upper bound",note))
def ft(t): return f"{t:.6g}" if t<1 else f"{t:.5g}"
with open('/mnt/user-data/outputs/nema_code_letter_lra_lines.csv','w',newline='') as f:
    w=csv.writer(f); w.writerow(["type","mfg","mpn","time (s)","current (a)","band","source","notes"])
    for ty,mfg,mpn,t,c,band,src,note in rows: w.writerow([ty,mfg,mpn,ft(t),f"{c:.4g}",band,src,note])
print("rows:",len(rows))
