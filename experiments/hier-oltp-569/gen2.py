# -*- coding: utf-8 -*-
# Дозамер #569 (вторая волна): КОРРЕЛЯЦИИ полей и ТРЁХУРОВНЕВЫЙ разрез.
#
# Отличие от gen.py: филиал определяет валюту и узкий набор MCC — как в реальности
# («филиал работает в одной валюте и с постоянным кругом мерчантов»). Это уменьшает
# число групп разреза, то есть ровно тот параметр, от которого зависит весь результат.
#
# Выход: flat_c.csv (плоско), hier4_c.csv (разрез из 4 полей), hier3_c.csv (три уровня:
# (дата,филиал) → (валюта,тип) → транзакция).
import random, csv, datetime, os, sys

N_TX = int(sys.argv[1]) if len(sys.argv) > 1 else 1_000_000
OUT = os.path.dirname(os.path.abspath(__file__))
DAYS = 90
D0 = datetime.date(2026, 6, 1)

T_TX, T_CUT, T_CUT2 = 100, 200, 201
NAMES = ("pan code amount settlement billing DT billing_fee rate rate_billing audit_no time TX_DT "
         "DTexpire DTsettle DTconvert DTcapture Merchant_Type ACC Pext ICC POS_mode APAN ISO PC CC R "
         "TR_fee S_fee TP_fee SP_fee Acq_IIC Fwd_IIC PAN_extended T2 T3 RRN Auth RC SRC CATI CAIC CAN "
         "ARD T1 CCY CCYs CCYb PIN_hash SRCI toExport Gosb Memorial Status").split()
REQ = {n: 1001 + i for i, n in enumerate(NAMES)}

GOSB = [f"Gosb-{i:02d}" for i in range(50)]
MTYPE = [f"MCC-{i}" for i in (5411, 5812, 6011, 4111, 5541, 5912, 5999, 4814, 5311, 7011)]
ISO = ["0200", "0210", "0400", "0420"]
PC = [f"{i:02d}0000" for i in (0, 1, 20, 26, 28)]
POS = ["051", "071", "812", "902"]
STATUS = ["OK", "OK", "OK", "OK", "DECLINED", "REVERSED"]

# ── корреляции: профиль филиала ──
# валюта: 45 филиалов почти всегда RUB, 3 — USD-ориентированные, 2 — EUR.
# мерчанты: у каждого филиала свой круг из 3 типов вместо всех десяти.
rnd0 = random.Random(569)
PROFILE = {}
for i, g in enumerate(GOSB):
    if i < 45:   ccy_mix = ["RUB"] * 97 + ["USD"] * 2 + ["EUR"]
    elif i < 48: ccy_mix = ["USD"] * 80 + ["RUB"] * 18 + ["EUR"] * 2
    else:        ccy_mix = ["EUR"] * 80 + ["RUB"] * 18 + ["USD"] * 2
    PROFILE[g] = {"ccy": ccy_mix, "mcc": rnd0.sample(MTYPE, 3)}

def tx_fields(day, rnd):
    dt = (D0 + datetime.timedelta(days=day)).isoformat()
    gosb = rnd.choice(GOSB)
    prof = PROFILE[gosb]
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
        "Merchant_Type": rnd.choice(prof["mcc"]),
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
        "CCY": rnd.choice(prof["ccy"]), "CCYs": "RUB", "CCYb": "RUB",
        "PIN_hash": f"{rnd.getrandbits(64):016x}", "SRCI": "1", "toExport": "X",
        "Gosb": gosb, "Memorial": "", "Status": rnd.choice(STATUS),
    }

class Layout:
    """cut1 — поля верхнего разреза, cut2 — поля второго (пусто = двухуровневая схема)."""
    def __init__(self, path, cut1, cut2=()):
        self.w = csv.writer(open(path, "w", newline="", encoding="utf-8"))
        self.cut1, self.cut2 = list(cut1), list(cut2)
        self.id = 0; self.rows = 0
        self.g1, self.g2 = {}, {}
    def nid(self):
        self.id += 1; return self.id
    def row(self, i, u, t, v):
        self.w.writerow([i, u, t, v]); self.rows += 1
    def group(self, cache, key, up, tcode, names, f):
        gid = cache.get(key)
        if gid is None:
            gid = self.nid()
            self.row(gid, up, tcode, "|".join(key))
            for n in names:
                self.row(self.nid(), gid, REQ[n], f[n])
            cache[key] = gid
        return gid
    def add_tx(self, txno, f):
        up = 1
        if self.cut1:
            k1 = tuple(f[n] for n in self.cut1)
            up = self.group(self.g1, k1, 1, T_CUT, self.cut1, f)
            if self.cut2:
                k2 = k1 + tuple(f[n] for n in self.cut2)
                up = self.group(self.g2, k2, up, T_CUT2, self.cut2, f)
        oid = self.nid()
        self.row(oid, up, T_TX, f"TX{txno}")
        skip = set(self.cut1) | set(self.cut2)
        for n in NAMES:
            if n not in skip and f[n] != "":
                self.row(self.nid(), oid, REQ[n], f[n])

def main():
    rnd = random.Random(1569)
    per_day = N_TX // DAYS
    layouts = {
        "flat_c":  Layout(os.path.join(OUT, "flat_c.csv"), []),
        "hier4_c": Layout(os.path.join(OUT, "hier4_c.csv"), ["DT", "Gosb", "CCY", "Merchant_Type"]),
        "hier3_c": Layout(os.path.join(OUT, "hier3_c.csv"), ["DT", "Gosb"], ["CCY", "Merchant_Type"]),
    }
    tx = 0
    for day in range(DAYS):
        for _ in range(per_day):
            f = tx_fields(day, rnd); tx += 1
            for q in layouts.values():
                q.add_tx(tx, f)
    print("tx:", tx)
    for name, q in layouts.items():
        g1, g2 = len(q.g1), len(q.g2)
        line = f"{name}: rows={q.rows} rows/tx={q.rows/tx:.2f}"
        if g1: line += f" L1-групп={g1} (tx/группу {tx/g1:.1f})"
        if g2: line += f" L2-групп={g2} (tx/группу {tx/g2:.1f})"
        print(line)

if __name__ == "__main__":
    main()
