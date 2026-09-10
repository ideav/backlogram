# -*- coding: utf-8 -*-
# Генератор данных для исследования #569 (иерархический OLTP на квартетах).
# N транзакций «как в habr 900308»: 45 заполненных реквизитов из 54.
# CSV для COPY: wide.csv, flat.csv, hier2.csv, hier4.csv, hier8.csv
import random, csv, datetime, os, sys

N_TX = int(sys.argv[1]) if len(sys.argv) > 1 else 1_000_000
OUT = os.path.dirname(os.path.abspath(__file__))

DAYS = 90
D0 = datetime.date(2026, 6, 1)
GOSB = [f"Gosb-{i:02d}" for i in range(50)]
CCY = ["RUB"] * 90 + ["USD"] * 7 + ["EUR"] * 3
MTYPE = [f"MCC-{i}" for i in (5411, 5812, 6011, 4111, 5541, 5912, 5999, 4814, 5311, 7011)]
ISO = ["0200", "0210", "0400", "0420"]
PC = [f"{i:02d}0000" for i in (0, 1, 20, 26, 28)]
POS = ["051", "071", "812", "902"]
STATUS = ["OK", "OK", "OK", "OK", "DECLINED", "REVERSED"]

T_TX, T_CUT = 100, 200
NAMES = ("pan code amount settlement billing DT billing_fee rate rate_billing audit_no time TX_DT "
         "DTexpire DTsettle DTconvert DTcapture Merchant_Type ACC Pext ICC POS_mode APAN ISO PC CC R "
         "TR_fee S_fee TP_fee SP_fee Acq_IIC Fwd_IIC PAN_extended T2 T3 RRN Auth RC SRC CATI CAIC CAN "
         "ARD T1 CCY CCYs CCYb PIN_hash SRCI toExport Gosb Memorial Status").split()
REQ = {n: 1001 + i for i, n in enumerate(NAMES)}

VARIANTS = {
    "hier2": ["DT", "Gosb"],
    "hier4": ["DT", "Gosb", "CCY", "Merchant_Type"],
    "hier8": ["DT", "Gosb", "CCY", "Merchant_Type", "ISO", "PC", "POS_mode", "Status"],
}

def tx_fields(day, rnd):
    dt = (D0 + datetime.timedelta(days=day)).isoformat()
    return {
        "pan": f"4{rnd.randrange(10**14, 10**15)}",
        "code": f"{rnd.randrange(100000):06d}",
        "amount": f"{rnd.randrange(100, 5_000_000) / 100:.2f}",
        "settlement": f"{rnd.randrange(100, 5_000_000) / 100:.2f}",
        "billing": f"{rnd.randrange(100, 5_000_000) / 100:.2f}",
        "DT": dt,
        "billing_fee": f"{rnd.randrange(0, 5000) / 100:.2f}",
        "rate": "1.0000", "rate_billing": "1.0000",
        "audit_no": f"{rnd.randrange(10**6):06d}",
        "time": f"{rnd.randrange(24):02d}:{rnd.randrange(60):02d}:{rnd.randrange(60):02d}",
        "TX_DT": dt, "DTexpire": "2028-12-31", "DTsettle": dt, "DTconvert": dt, "DTcapture": dt,
        "Merchant_Type": rnd.choice(MTYPE),
        "ACC": f"408178108{rnd.randrange(10**11):011d}",
        "Pext": "", "ICC": f"{rnd.randrange(10**4):04d}",
        "POS_mode": rnd.choice(POS),
        "APAN": "", "ISO": rnd.choice(ISO), "PC": rnd.choice(PC),
        "CC": "643", "R": "0",
        "TR_fee": f"{rnd.randrange(0, 1000) / 100:.2f}", "S_fee": "0.00",
        "TP_fee": "0.00", "SP_fee": "0.00",
        "Acq_IIC": f"{rnd.randrange(10**6):06d}", "Fwd_IIC": f"{rnd.randrange(10**6):06d}",
        "PAN_extended": "", "T2": "", "T3": "",
        "RRN": f"{rnd.randrange(10**12):012d}",
        "Auth": f"{rnd.randrange(10**6):06d}", "RC": "00",
        "SRC": "02", "CATI": f"CT{rnd.randrange(10**6):06d}", "CAIC": f"CA{rnd.randrange(10**6):06d}",
        "CAN": f"{rnd.randrange(10**8):08d}", "ARD": "", "T1": "",
        "CCY": rnd.choice(CCY), "CCYs": "RUB", "CCYb": "RUB",
        "PIN_hash": f"{rnd.getrandbits(64):016x}", "SRCI": "1", "toExport": "X",
        "Gosb": rnd.choice(GOSB), "Memorial": "", "Status": rnd.choice(STATUS),
    }

class Quartets:
    def __init__(self, path, cut_names):
        self.w = csv.writer(open(path, "w", newline="", encoding="utf-8"))
        self.cut = cut_names
        self.id = 0
        self.groups = {}
        self.rows = 0
    def nid(self):
        self.id += 1
        return self.id
    def row(self, i, u, t, v):
        self.w.writerow([i, u, t, v])
        self.rows += 1
    def add_tx(self, txno, f):
        up = 1
        if self.cut:
            key = tuple(f[n] for n in self.cut)
            gid = self.groups.get(key)
            if gid is None:
                gid = self.nid()
                self.row(gid, 1, T_CUT, "|".join(key))
                for n in self.cut:
                    self.row(self.nid(), gid, REQ[n], f[n])
                self.groups[key] = gid
            up = gid
        oid = self.nid()
        self.row(oid, up, T_TX, f"TX{txno}")
        for n in NAMES:
            if n not in self.cut and f[n] != "":
                self.row(self.nid(), oid, REQ[n], f[n])

def main():
    rnd = random.Random(569)
    per_day = N_TX // DAYS
    wide = csv.writer(open(os.path.join(OUT, "wide.csv"), "w", newline="", encoding="utf-8"))
    layouts = {"flat": Quartets(os.path.join(OUT, "flat.csv"), [])}
    for name, cut in VARIANTS.items():
        layouts[name] = Quartets(os.path.join(OUT, f"{name}.csv"), cut)
    tx = 0
    for day in range(DAYS):
        for _ in range(per_day):
            f = tx_fields(day, rnd)
            tx += 1
            wide.writerow([tx] + [f[n] for n in NAMES])
            for q in layouts.values():
                q.add_tx(tx, f)
    print("tx:", tx)
    for name, q in layouts.items():
        g = len(q.groups)
        print(f"{name}: rows={q.rows} groups={g} rows/tx={q.rows/tx:.2f}"
              + (f" tx/group={tx/g:.1f}" if g else ""))

if __name__ == "__main__":
    main()
