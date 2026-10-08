
(function (root) {
    'use strict';

    // ---------------------------------------------------------------------------
    // Dictionary rules — ordered from most specific to least specific.
    // Each rule matches if the lowercased trimmed name contains the pattern.
    // ---------------------------------------------------------------------------
    var DICT = [
        // ── DATE (9) ────────────────────────────────────────────────────────────
        { p: /date\s*(and|&)\s*time/,         type: 4,  ref: false },
        { p: /^(birth\s*date|date\s+of\s+birth|dob|birthday)$/,type: 9,  ref: false },
        { p: /(^|[\s_])date([\s_]|$)/,        type: 9,  ref: false },
        { p: /^dated?$/,                      type: 9,  ref: false },
        { p: /(^|[\s_])due([\s_]|$)/,         type: 9,  ref: false },
        { p: /expir(y|ation)/,                type: 9,  ref: false },
        { p: /valid\s+(until|through|thru)/,  type: 9,  ref: false },
        { p: /^term$/,                        type: 9,  ref: false },
        { p: /deadline/i,                type: 9,  ref: false },

        // ── DATETIME (4) ────────────────────────────────────────────────────────
        { p: /^(completed|closed|sent|finished|approved|paid|confirmed|accepted|cancell?ed|published|created|updated|modified|deleted|archived)[\s_]*at$/,type: 4,  ref: false },
        { p: /(created|updated|modified|deleted|start|end)[\s_]+time/,type: 4,  ref: false },
        { p: /archived\s*at/i,           type: 4,  ref: false },
        { p: /created\s*at/i,            type: 4,  ref: false },
        { p: /updated\s*at/i,            type: 4,  ref: false },
        { p: /deleted\s*at/i,            type: 4,  ref: false },
        { p: /timestamp/i,               type: 4,  ref: false },
        { p: /datetime/i,                type: 4,  ref: false },

        // ── NUMBER integer (13) ──────────────────────────────────────────────────
        { p: /(phone|mobile|serial|passport|tax\s*id|vat|account|card|tracking|routing)[\s_]*(number|no\.?|#)/,type: 3,  ref: false },
        { p: /^(qty|no\.?|num|#|floor|page|month|day|size|rank|item\s*no\.?)$/,type: 13, ref: false },
        { p: /^(number|count|quantity|qty)\s+of\b/,type: 13, ref: false },
        { p: /(^|[\s_])(qty|count|quantity)([\s_]|$)/,type: 13, ref: false },
        { p: /(^|[\s_])number([\s_]|$)/,      type: 13, ref: false },
        { p: /^(birth|release|founding|manufacture)\s*year$/,type: 13, ref: false },
        { p: /^count$/i,                 type: 13, ref: false },
        { p: /^quantity$/i,              type: 13, ref: false },
        { p: /^number$/i,                type: 13, ref: false },
        { p: /^age$/i,                   type: 13, ref: false },
        { p: /^year$/i,                  type: 13, ref: false },
        { p: /^priority$/i,              type: 13, ref: false },
        { p: /^position$/i,              type: 13, ref: false },
        { p: /^sort\s*(order)?$/i,       type: 13, ref: false },
        { p: /^order\s*num(ber)?$/i,     type: 13, ref: false },

        // ── SIGNED decimal (14) ──────────────────────────────────────────────────
        { p: /^(mass|share|value|subtotal|grand\s*total|area|length|width|height|depth|tariff|fee|vat|markup|margin|loss|expense|expenses|income|remaining|stock|debt|payment|percent|percentage|exchange\s*rate|coefficient|factor|ratio|plan|actual|rating|score|wage)$/,type: 14, ref: false },
        { p: /(net|gross)\s*weight/,          type: 14, ref: false },
        { p: /(^|[\s_])(amount|sum|cost|price|volume|area)([\s_]|$)/,type: 14, ref: false },
        { p: /^amount$/i,                type: 14, ref: false },
        { p: /^price$/i,                 type: 14, ref: false },
        { p: /^cost$/i,                  type: 14, ref: false },
        { p: /^total$/i,                 type: 14, ref: false },
        { p: /^weight$/i,                type: 14, ref: false },
        { p: /^volume$/i,                type: 14, ref: false },
        { p: /^sum$/i,                   type: 14, ref: false },
        { p: /^tax$/i,                   type: 14, ref: false },
        { p: /^discount$/i,              type: 14, ref: false },
        { p: /^rate$/i,                  type: 14, ref: false },
        { p: /^balance$/i,               type: 14, ref: false },
        { p: /^profit$/i,                type: 14, ref: false },
        { p: /^revenue$/i,               type: 14, ref: false },
        { p: /^salary$/i,                type: 14, ref: false },

        // ── BOOLEAN (11) ─────────────────────────────────────────────────────────
        { p: /^(is|has)\s/,                   type: 11, ref: false },
        { p: /^(visible|hidden|blocked|locked|paid|approved|checked|flag|yes\/no|y\/n)$/,type: 11, ref: false },
        { p: /(^|[\s_])flag([\s_]|$)/,        type: 11, ref: false },
        { p: /^archived$/i,              type: 11, ref: false },
        { p: /^enabled$/i,               type: 11, ref: false },
        { p: /^disabled$/i,              type: 11, ref: false },
        { p: /^active$/i,                type: 11, ref: false },
        { p: /^deleted$/i,               type: 11, ref: false },
        { p: /^published$/i,             type: 11, ref: false },
        { p: /^verified$/i,              type: 11, ref: false },
        { p: /^confirmed$/i,             type: 11, ref: false },
        { p: /^is_/i,                    type: 11, ref: false },
        { p: /^has_/i,                   type: 11, ref: false },

        // ── FILE (10) ────────────────────────────────────────────────────────────
        { p: /^(scan|scanned\s*copy|img|attachments|files)$/,type: 10, ref: false },
        { p: /(^|[\s_])(file|photo|scan|image)([\s_]|$)/,type: 10, ref: false },
        { p: /^pdf$/i,                   type: 10, ref: false },
        { p: /^attachment$/i,            type: 10, ref: false },
        { p: /^image$/i,                 type: 10, ref: false },
        { p: /^photo$/i,                 type: 10, ref: false },
        { p: /^picture$/i,               type: 10, ref: false },
        { p: /^avatar$/i,                type: 10, ref: false },
        { p: /^logo$/i,                  type: 10, ref: false },
        { p: /^file$/i,                  type: 10, ref: false },
        { p: /^document$/i,              type: 10, ref: false },

        // ── MULTILINE text (12) ──────────────────────────────────────────────────
        { p: /^(explanation|history|conditions|terms|requirements|instructions|regulations|result|conclusion|recommendations|comments|message|feedback)$/,type: 12, ref: false },
        { p: /(^|[\s_])(description|comment|notes)([\s_]|$)/,type: 12, ref: false },
        { p: /^description$/i,           type: 12, ref: false },
        { p: /^comment$/i,               type: 12, ref: false },
        { p: /^note$/i,                  type: 12, ref: false },
        { p: /^notes$/i,                 type: 12, ref: false },
        { p: /^remark$/i,                type: 12, ref: false },
        { p: /^remarks$/i,               type: 12, ref: false },
        { p: /^text$/i,                  type: 12, ref: false },
        { p: /^content$/i,               type: 12, ref: false },
        { p: /^body$/i,                  type: 12, ref: false },
        { p: /^details$/i,               type: 12, ref: false },
        { p: /^bio$/i,                   type: 12, ref: false },
        { p: /^biography$/i,             type: 12, ref: false },
        { p: /^summary$/i,               type: 12, ref: false },
        { p: /^about$/i,                 type: 12, ref: false },

        // ── SHORT string + REFERENCE (3, ref=true) ──────────────────────────────
        { p: /^(state|class|subcategory|subgroup|classification|section|specialty|specialization|profession|occupation|qualification|job\s*title|district|county|province|uom|unit\s*of\s*measure|permissions|access\s*level|tier|make|manufacturer|material|colou?r|format|sex|subtype|source|channel|lead\s*source|sales\s*channel|traffic\s*source|industry|payment\s*(method|type)|delivery\s*(method|type)|shipping\s*method|contract\s*type|(organization|company)\s*type)$/,type: 3,  ref: true },
        { p: /(^|[\s_])(type|status|category)([\s_]|$)/,type: 3,  ref: true },
        { p: /^status$/i,                type: 3,  ref: true  },
        { p: /^type$/i,                  type: 3,  ref: true  },
        { p: /^kind$/i,                  type: 3,  ref: true  },
        { p: /^category$/i,              type: 3,  ref: true  },
        { p: /^group$/i,                 type: 3,  ref: true  },
        { p: /^tag$/i,                   type: 3,  ref: true  },
        { p: /^tags$/i,                  type: 3,  ref: true  },
        { p: /^label$/i,                 type: 3,  ref: true  },
        { p: /^stage$/i,                 type: 3,  ref: true  },
        { p: /^phase$/i,                 type: 3,  ref: true  },
        { p: /^step$/i,                  type: 3,  ref: true  },
        { p: /^region$/i,                type: 3,  ref: true  },
        { p: /^country$/i,               type: 3,  ref: true  },
        { p: /^city$/i,                  type: 3,  ref: true  },
        { p: /^currency$/i,              type: 3,  ref: true  },
        { p: /^unit$/i,                  type: 3,  ref: true  },
        { p: /^role$/i,                  type: 3,  ref: true  },
        { p: /^brand$/i,                 type: 3,  ref: true  },
        { p: /^priority$/i,              type: 3,  ref: true  },
        { p: /^department$/i,            type: 3,  ref: true  },
        { p: /^division$/i,              type: 3,  ref: true  },
        { p: /^position$/i,              type: 3,  ref: true  },
        { p: /^gender$/i,                type: 3,  ref: true  },

        // ── SHORT string + no reference — people / companies ────────────────────
        { p: /^(buyer|counterparty|organi[sz]ation|enterprise|partner|contractor|assignee|employee|manager|owner|responsible|user|author|creator|reviewer|approver|supervisor|head|director|service|project|task|contract|agreement|order|invoice|account|object|asset|surname|middle\s*name|tax\s*id|ein|ssn|vat\s*id|passport|serial|website|site|link|fax|house|building|apartment|apt|suite|office|zip\s*code|postcode|warehouse|location|storage\s*location|bank|bank\s*account|iban|swift|bic)$/,type: 3,  ref: false },
        { p: /^url$/i,                   type: 3,  ref: false },
        { p: /^email$/i,                 type: 3,  ref: false },
        { p: /^e-mail$/i,                type: 3,  ref: false },
        { p: /^skype$/i,                 type: 3,  ref: false },
        { p: /^telegram$/i,              type: 3,  ref: false },
        { p: /^whatsapp$/i,              type: 3,  ref: false },
        { p: /^instagram$/i,             type: 3,  ref: false },
        { p: /^vk$/i,                    type: 3,  ref: false },
        { p: /^facebook$/i,              type: 3,  ref: false },
        { p: /^linkedin$/i,              type: 3,  ref: false },
        { p: /^id$/i,                    type: 3,  ref: false },
        { p: /^uuid$/i,                  type: 3,  ref: false },
        { p: /^guid$/i,                  type: 3,  ref: false },
        { p: /^name$/i,                  type: 3,  ref: false },
        { p: /^title$/i,                 type: 3,  ref: false },
        { p: /^first.?name$/i,           type: 3,  ref: false },
        { p: /^last.?name$/i,            type: 3,  ref: false },
        { p: /^full.?name$/i,            type: 3,  ref: false },
        { p: /^username$/i,              type: 3,  ref: false },
        { p: /^login$/i,                 type: 3,  ref: false },
        { p: /^phone$/i,                 type: 3,  ref: false },
        { p: /^mobile$/i,                type: 3,  ref: false },
        { p: /^address$/i,               type: 3,  ref: false },
        { p: /^street$/i,                type: 3,  ref: false },
        { p: /^zip$/i,                   type: 3,  ref: false },
        { p: /^postal\s*code$/i,         type: 3,  ref: false },
        { p: /^company$/i,               type: 3,  ref: false },
        { p: /^client$/i,                type: 3,  ref: false },
        { p: /^customer$/i,              type: 3,  ref: false },
        { p: /^vendor$/i,                type: 3,  ref: false },
        { p: /^supplier$/i,              type: 3,  ref: false },
        { p: /^product$/i,               type: 3,  ref: false },
        { p: /^item$/i,                  type: 3,  ref: false },
        { p: /^sku$/i,                   type: 3,  ref: false },
        { p: /^barcode$/i,               type: 3,  ref: false },
        { p: /^code$/i,                  type: 3,  ref: false },
        { p: /^article$/i,               type: 3,  ref: false },
        { p: /^token$/i,                 type: 3,  ref: false },
        { p: /^api.?key$/i,              type: 3,  ref: false },
    ];

    /**
     * Detect base type and reference flag from a column/table name.
     * Returns { type, ref } on match, or null if no rule matches.
     * @param {string} name
     * @returns {{ type: number, ref: boolean }|null}
     */
    function detectColumnType(name) {
        if (!name || typeof name !== 'string') return null;
        var lower = name.trim().toLowerCase();
        if (!lower) return null;
        for (var i = 0; i < DICT.length; i++) {
            if (DICT[i].p.test(lower)) {
                return { type: DICT[i].type, ref: DICT[i].ref };
            }
        }
        return null;
    }

    // Export
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = detectColumnType;
    } else {
        root.detectColumnType = detectColumnType;
    }
}(typeof window !== 'undefined' ? window : this));
