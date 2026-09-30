export const locales = {
    "en": {
        "tiers": [
            {
                "label": "Maximum decentralization",
                "definition": "As decentralized as Ethereum L1 itself within the reviewed mechanism; no additional administrator can rewrite its principal or exit rules.",
                "legend": "Maximum decentralization"
            },
            {
                "label": "Limited administration",
                "definition": "Bounded settings can change, while the reviewed asset custody and exit mechanism remains fixed.",
                "legend": "Limited settings; custody & exits fixed"
            },
            {
                "label": "External operation",
                "definition": "An oracle, allocation role, pause or other external operation materially affects the position without arbitrary replacement of its core.",
                "legend": "External oracles, allocation or pauses"
            },
            {
                "label": "Delayed governance",
                "definition": "Governance can change the system through a documented delay; user vetoes and exit protections are assessed explicitly.",
                "legend": "Rule changes through delayed governance"
            },
            {
                "label": "Independent emergency council",
                "definition": "An elected, accountable and diverse council can act immediately, alongside a delayed normal governance route.",
                "legend": "Independent council; emergency powers"
            },
            {
                "label": "Council and foundation",
                "definition": "A formally governed council shares immediate authority with a foundation, with additional foundation or fallback powers.",
                "legend": "Council + foundation authority"
            },
            {
                "label": "Council and operator",
                "definition": "An operator shares immediate authority with an appointed council, with limited public governance or removal rights.",
                "legend": "Appointed council + operator authority"
            },
            {
                "label": "Administrator upgrade",
                "definition": "A concentrated administrator or committee can replace core rules without a verified protective delay and independent veto.",
                "legend": "Administrator can replace core rules"
            },
            {
                "label": "Operator-governed validation",
                "definition": "The operator also restricts who may validate or challenge state, or can defeat ordinary inclusion or exit mechanisms.",
                "legend": "Operator also controls validation or exits"
            },
            {
                "label": "Issuer-controlled backing",
                "definition": "An issuer or custodian controls the backing, redemption or seizure of the asset. This dimension is additional to the chain it uses.",
                "legend": "Issuer controls backing or redemption"
            }
        ],
        "guideTitle": "Your guide to D0–D9",
        "guideQuestion": "Who can change the rules?",
        "guideIntro": "Imagine Ethereum as shared ground, and each app as a building on it. A D-number tells you how much extra authority sits between you and that ground.",
        "guideAction": "Open the plain-language guide",
        "explain": "Explain this rating",
        "close": "Close",
        "foundationTitle": "D0 starts at Ethereum",
        "foundationBody": "No extra administrator can rewrite the reviewed mechanism. D1 adds bounded settings; higher levels add stronger powers over rules, validation or backing.",
        "dependencyTitle": "Follow every dependency",
        "dependencyBody": "An asset carries the strongest authority along its chain, app and issuer path. ETH in a D5 rollup is D5. An issuer-controlled token remains D9 even on Ethereum.",
        "unknownTitle": "Read the question marks",
        "unknownBody": "D? means the review is incomplete. ≥D5 means at least D5: an unresolved dependency may add more authority. Neither means safe or unsafe.",
        "judgmentTitle": "Authority, not a verdict",
        "judgmentBody": "This is an editorial guide to control, not a security score, return forecast or ranking of good and bad projects. The evidence and review date matter.",
        "spectrum": "Explore the spectrum",
        "evidence": "Evidence and limits",
        "l1": "Open ground for everyone. Even the tallest institutions stand stronger on a shared foundation."
    },
    "zh": {
        "tiers": [
            {
                "label": "最大程度去中心化",
                "definition": "在评估范围内，没有比以太坊 L1 额外的特权主体控制本金或退出。",
                "legend": "最大去中心化"
            },
            {
                "label": "有限管理",
                "definition": "管理员只能调整有边界的参数，没有已知任意转移本金的权限。",
                "legend": "有限设置；托管与退出规则固定"
            },
            {
                "label": "外部运营",
                "definition": "依赖预言机、分配者或暂停等外部运营权限。",
                "legend": "外部预言机、分配或暂停权限"
            },
            {
                "label": "有延迟的治理",
                "definition": "治理可更改系统，但普通变更有公开记录的强制延迟。",
                "legend": "治理变更须经过延迟期"
            },
            {
                "label": "独立紧急委员会",
                "definition": "选举产生且可问责的委员会可紧急升级；普通变更有延迟。",
                "legend": "独立委员会拥有紧急权限"
            },
            {
                "label": "委员会与基金会",
                "definition": "正式委员会与基金会共同保有即时升级权限，存在基金会后备权力。",
                "legend": "委员会与基金会共享权限"
            },
            {
                "label": "委员会与运营方",
                "definition": "指定的委员会与运营方共同控制即时升级，公开罢免机制有限。",
                "legend": "指定委员会与运营方共享权限"
            },
            {
                "label": "管理员升级",
                "definition": "集中式管理员可升级系统，未核实有效延迟或独立否决机制。",
                "legend": "管理员可替换核心规则"
            },
            {
                "label": "运营方控制验证",
                "definition": "运营方还控制验证者或挑战者准入，可能限制强制纳入交易。",
                "legend": "运营方还控制验证或退出"
            },
            {
                "label": "发行方控制储备",
                "definition": "发行方或托管方可控制链外储备、赎回或冻结资产。",
                "legend": "发行方控制储备或赎回"
            }
        ],
        "guideTitle": "D0–D9 入门指南",
        "guideQuestion": "谁能改变规则？",
        "guideIntro": "把以太坊想成共同的地基，每个应用都是上面的建筑。D 值说明你与地基之间增加了多少控制权。",
        "guideAction": "打开通俗指南",
        "explain": "解释此评级",
        "close": "关闭",
        "foundationTitle": "D0 以以太坊为基准",
        "foundationBody": "没有额外管理员能改写已评估机制。D1 增加有限设置；更高等级增加规则、验证或资产支持方面的权力。",
        "dependencyTitle": "追踪每一层依赖",
        "dependencyBody": "资产继承所在链、应用和发行方中最强的控制权。D5 网络中的 ETH 为 D5；发行方控制的代币即使在以太坊上仍是 D9。",
        "unknownTitle": "理解问号",
        "unknownBody": "D? 表示评估未完成。≥D5 表示至少为 D5，未确定的依赖可能增加控制权。两者都不是安全结论。",
        "judgmentTitle": "控制权，而非好坏结论",
        "judgmentBody": "这是控制权的编辑性指南，不是安全评分、回报预测或项目优劣排名。请查看证据和评估日期。",
        "spectrum": "查看完整光谱",
        "evidence": "证据与局限",
        "l1": "人人共享的开放地基。再高的机构，也因共同的基础而更加稳固。"
    },
    "es": {
        "tiers": [
            {
                "label": "Máxima descentralización",
                "definition": "Sin control privilegiado adicional del principal o de la salida respecto a Ethereum L1, en el ámbito revisado.",
                "legend": "Máxima descentralización"
            },
            {
                "label": "Administración limitada",
                "definition": "Permite ajustar parámetros acotados, sin un poder conocido para mover arbitrariamente el principal.",
                "legend": "Ajustes limitados; custodia y salida fijas"
            },
            {
                "label": "Operación externa",
                "definition": "Depende de poderes operativos externos: oráculos, asignadores o pausas.",
                "legend": "Oráculos, asignación o pausas externas"
            },
            {
                "label": "Gobernanza con demora",
                "definition": "La gobernanza puede modificar el sistema, con una demora obligatoria documentada para cambios ordinarios.",
                "legend": "Cambios mediante gobernanza con demora"
            },
            {
                "label": "Consejo de emergencia independiente",
                "definition": "Un consejo elegido y responsable puede actuar de emergencia; los cambios ordinarios tienen demora.",
                "legend": "Consejo independiente; poderes de emergencia"
            },
            {
                "label": "Consejo y fundación",
                "definition": "Un consejo formal y una fundación comparten actualizaciones inmediatas, con facultades de respaldo de la fundación.",
                "legend": "Autoridad del consejo y la fundación"
            },
            {
                "label": "Consejo y operador",
                "definition": "Un consejo designado y un operador controlan actualizaciones inmediatas, con destitución pública limitada.",
                "legend": "Consejo designado y operador"
            },
            {
                "label": "Actualización administrativa",
                "definition": "Un administrador concentrado puede actualizar el sistema sin demora eficaz o veto independiente verificados.",
                "legend": "Un administrador puede sustituir las reglas"
            },
            {
                "label": "Validación dirigida por el operador",
                "definition": "El operador controla quién valida o impugna, y puede limitar la inclusión forzada.",
                "legend": "El operador controla validación o salidas"
            },
            {
                "label": "Respaldo controlado por el emisor",
                "definition": "Un emisor o custodio controla reservas externas, reembolsos o congelación de activos.",
                "legend": "El emisor controla respaldo o reembolso"
            }
        ],
        "guideTitle": "Guía de D0–D9",
        "guideQuestion": "¿Quién puede cambiar las reglas?",
        "guideIntro": "Imagina Ethereum como un terreno compartido y cada app como un edificio. D indica cuánta autoridad adicional existe entre tú y ese terreno.",
        "guideAction": "Abrir la guía sencilla",
        "explain": "Explicar esta categoría",
        "close": "Cerrar",
        "foundationTitle": "D0 parte de Ethereum",
        "foundationBody": "Ningún administrador adicional puede reescribir el mecanismo evaluado. D1 añade ajustes limitados; los niveles mayores añaden poder sobre reglas, validación o respaldo.",
        "dependencyTitle": "Sigue cada dependencia",
        "dependencyBody": "El activo hereda la autoridad más fuerte de su cadena, app y emisor. ETH en un rollup D5 es D5. Un token controlado por su emisor sigue siendo D9 en Ethereum.",
        "unknownTitle": "Interpreta las incógnitas",
        "unknownBody": "D? indica una evaluación incompleta. ≥D5 significa al menos D5: otra dependencia puede añadir autoridad. No es un juicio de seguridad.",
        "judgmentTitle": "Autoridad, no un veredicto",
        "judgmentBody": "Una guía editorial del control, no una puntuación de seguridad, previsión de rentabilidad ni clasificación moral. Consulta las pruebas y su fecha.",
        "spectrum": "Explora el espectro",
        "evidence": "Pruebas y límites",
        "l1": "Terreno abierto para todos. Incluso las instituciones más altas se sostienen mejor sobre cimientos compartidos."
    },
    "ja": {
        "tiers": [
            {
                "label": "最大の分散性",
                "definition": "評価範囲で、Ethereum L1以外に元本や退出を管理する特権主体はありません。",
                "legend": "最大の分散性"
            },
            {
                "label": "限定的な管理",
                "definition": "管理者は限定された設定を変更できますが、任意に元本を動かす権限は確認されていません。",
                "legend": "設定変更は限定的；保管と退出の仕組みは固定"
            },
            {
                "label": "外部の運用",
                "definition": "オラクル、資産配分、停止など外部の運用権限に依存します。",
                "legend": "外部オラクル・配分・停止の権限"
            },
            {
                "label": "遅延付きガバナンス",
                "definition": "システム変更が可能ですが、通常の変更には文書化された強制待機期間があります。",
                "legend": "遅延期間を伴うガバナンスによる変更"
            },
            {
                "label": "独立した緊急評議会",
                "definition": "選挙と説明責任のある評議会が緊急更新でき、通常の変更には遅延があります。",
                "legend": "独立評議会による緊急権限"
            },
            {
                "label": "評議会と財団",
                "definition": "正式な評議会と財団が即時更新を共同管理し、財団へのフォールバックがあります。",
                "legend": "評議会と財団の共同権限"
            },
            {
                "label": "評議会と運営者",
                "definition": "任命された評議会と運営者が即時更新を共同管理し、公的な解任権は限定的です。",
                "legend": "任命評議会と運営者の共同権限"
            },
            {
                "label": "管理者による更新",
                "definition": "集中した管理者が更新でき、有効な遅延や独立した拒否権は未確認です。",
                "legend": "管理者が中核ルールを変更可能"
            },
            {
                "label": "運営者が検証を管理",
                "definition": "運営者は検証者・異議申立者の参加も制限し、強制包含を制限する場合があります。",
                "legend": "運営者が検証や退出も制御"
            },
            {
                "label": "発行者が裏付けを管理",
                "definition": "発行者や保管者がオフチェーンの準備資産、償還、凍結を管理できます。",
                "legend": "発行者が裏付け資産や償還を制御"
            }
        ],
        "guideTitle": "D0–D9 のやさしいガイド",
        "guideQuestion": "ルールを変えられるのは誰？",
        "guideIntro": "Ethereum を共有の土地、アプリをその上の建物と考えてください。D は、あなたと土台の間に加わる権限を表します。",
        "guideAction": "やさしいガイドを開く",
        "explain": "この評価を説明",
        "close": "閉じる",
        "foundationTitle": "D0 は Ethereum が基準",
        "foundationBody": "評価対象の仕組みを書き換える追加の管理者はいません。D1 は限定的な設定、より高い段階はルール・検証・裏付けへの権限を加えます。",
        "dependencyTitle": "すべての依存先をたどる",
        "dependencyBody": "資産はチェーン・アプリ・発行者のうち最も強い権限を引き継ぎます。D5 のロールアップ上の ETH は D5。発行者管理のトークンは Ethereum 上でも D9 です。",
        "unknownTitle": "疑問符の読み方",
        "unknownBody": "D? は評価未完了。≥D5 は少なくとも D5 で、未確認の依存先が権限を加える可能性があります。安全性の判定ではありません。",
        "judgmentTitle": "権限の説明であり、優劣の判定ではありません",
        "judgmentBody": "管理権限の編集的ガイドです。安全性の点数、収益予測、善悪の順位ではありません。根拠と評価日を確認してください。",
        "spectrum": "全体を見る",
        "evidence": "根拠と限界",
        "l1": "誰にでも開かれた大地。大きな組織も、共有の土台でいっそう強く立てます。"
    },
    "ko": {
        "tiers": [
            {
                "label": "최대 탈중앙화",
                "definition": "평가 범위에서 이더리움 L1 외에 원금이나 출금을 통제하는 특권 주체가 없습니다.",
                "legend": "최대 탈중앙화"
            },
            {
                "label": "제한된 관리",
                "definition": "관리자는 제한된 설정만 변경하며 원금을 임의로 옮기는 권한은 확인되지 않았습니다.",
                "legend": "제한된 설정; 보관·출금 규칙 고정"
            },
            {
                "label": "외부 운영",
                "definition": "오라클, 배분자 또는 일시 중지 같은 외부 운영 권한에 의존합니다.",
                "legend": "외부 오라클·배분·일시 중지 권한"
            },
            {
                "label": "지연이 있는 거버넌스",
                "definition": "시스템 변경이 가능하나 일반 변경에는 문서화된 강제 지연이 있습니다.",
                "legend": "지연 기간을 둔 거버넌스 변경"
            },
            {
                "label": "독립적 긴급 위원회",
                "definition": "선출되고 책임을 지는 위원회가 긴급 업그레이드를 수행하며 일반 변경에는 지연이 있습니다.",
                "legend": "독립 위원회의 긴급 권한"
            },
            {
                "label": "위원회와 재단",
                "definition": "공식 위원회와 재단이 즉시 업그레이드를 공동 통제하며 재단 대체 권한이 있습니다.",
                "legend": "위원회와 재단의 공동 권한"
            },
            {
                "label": "위원회와 운영자",
                "definition": "임명된 위원회와 운영자가 즉시 업그레이드를 통제하며 공개 해임 수단은 제한됩니다.",
                "legend": "지명 위원회와 운영자의 공동 권한"
            },
            {
                "label": "관리자 업그레이드",
                "definition": "집중된 관리자가 업그레이드하며 유효한 지연이나 독립적 거부권은 미확인입니다.",
                "legend": "관리자가 핵심 규칙 교체 가능"
            },
            {
                "label": "운영자 주도 검증",
                "definition": "운영자는 검증자나 이의 제기자 참여를 제한하고 강제 거래 포함도 제한할 수 있습니다.",
                "legend": "운영자가 검증이나 출금도 통제"
            },
            {
                "label": "발행자 주도 담보",
                "definition": "발행자나 수탁자가 오프체인 준비금, 상환 또는 자산 동결을 통제할 수 있습니다.",
                "legend": "발행자가 담보나 상환 통제"
            }
        ],
        "guideTitle": "D0–D9 쉽게 이해하기",
        "guideQuestion": "누가 규칙을 바꿀 수 있나요?",
        "guideIntro": "이더리움을 공동의 땅, 앱을 그 위의 건물이라고 생각하세요. D는 나와 기반 사이에 추가된 권한을 보여 줍니다.",
        "guideAction": "쉬운 안내 열기",
        "explain": "이 등급 설명",
        "close": "닫기",
        "foundationTitle": "D0는 이더리움이 기준",
        "foundationBody": "검토된 구조를 바꿀 추가 관리자가 없습니다. D1은 제한된 설정을, 더 높은 단계는 규칙·검증·담보에 대한 권한을 더합니다.",
        "dependencyTitle": "모든 의존 관계 따라가기",
        "dependencyBody": "자산은 체인·앱·발행자 중 가장 강한 권한을 상속합니다. D5 롤업의 ETH는 D5입니다. 발행자가 통제하는 토큰은 이더리움에서도 D9입니다.",
        "unknownTitle": "물음표 이해하기",
        "unknownBody": "D?는 검토 미완료입니다. ≥D5는 최소 D5이며 미확인 의존 관계가 권한을 더할 수 있습니다. 안전성 판정은 아닙니다.",
        "judgmentTitle": "권한 설명이지 가치 판단이 아닙니다",
        "judgmentBody": "통제에 대한 편집적 안내입니다. 보안 점수, 수익 예측, 선악 순위가 아닙니다. 근거와 검토 날짜를 확인하세요.",
        "spectrum": "전체 스펙트럼 보기",
        "evidence": "근거와 한계",
        "l1": "모두에게 열린 땅. 아무리 큰 기관도 함께 쓰는 기반 위에서 더 단단히 섭니다."
    },
    "fr": {
        "tiers": [
            {
                "label": "Décentralisation maximale",
                "definition": "Aucun contrôle privilégié supplémentaire du capital ou de la sortie par rapport à Ethereum L1, dans le périmètre examiné.",
                "legend": "Décentralisation maximale"
            },
            {
                "label": "Administration limitée",
                "definition": "Réglages bornés, sans pouvoir connu de déplacer arbitrairement le capital.",
                "legend": "Réglages limités ; garde et sortie fixes"
            },
            {
                "label": "Opération externe",
                "definition": "Dépend de pouvoirs opérationnels externes : oracles, allocateurs ou pauses.",
                "legend": "Oracles, allocation ou pauses externes"
            },
            {
                "label": "Gouvernance avec délai",
                "definition": "La gouvernance peut modifier le système, avec un délai obligatoire documenté pour les changements ordinaires.",
                "legend": "Modifications par gouvernance avec délai"
            },
            {
                "label": "Conseil d’urgence indépendant",
                "definition": "Un conseil élu et responsable peut agir en urgence ; les changements ordinaires sont retardés.",
                "legend": "Conseil indépendant ; pouvoirs d’urgence"
            },
            {
                "label": "Conseil et fondation",
                "definition": "Un conseil formel et une fondation partagent les mises à niveau immédiates, avec des pouvoirs de repli de la fondation.",
                "legend": "Autorité du conseil et de la fondation"
            },
            {
                "label": "Conseil et opérateur",
                "definition": "Un conseil nommé et un opérateur contrôlent les mises à niveau immédiates ; la révocation publique est limitée.",
                "legend": "Conseil nommé et opérateur"
            },
            {
                "label": "Mise à niveau administrative",
                "definition": "Un administrateur concentré peut modifier le système, sans délai efficace ni veto indépendant vérifiés.",
                "legend": "L’administrateur peut remplacer les règles"
            },
            {
                "label": "Validation régie par l’opérateur",
                "definition": "L’opérateur contrôle l’admission des validateurs ou contestataires et peut limiter l’inclusion forcée.",
                "legend": "L’opérateur contrôle validation ou sorties"
            },
            {
                "label": "Réserves régies par l’émetteur",
                "definition": "L’émetteur ou le dépositaire contrôle les réserves hors chaîne, le rachat ou le gel des actifs.",
                "legend": "L’émetteur contrôle réserves ou rachat"
            }
        ],
        "guideTitle": "Comprendre D0–D9",
        "guideQuestion": "Qui peut changer les règles ?",
        "guideIntro": "Imaginez Ethereum comme un terrain commun, et chaque app comme un bâtiment. D indique les pouvoirs supplémentaires entre vous et ce terrain.",
        "guideAction": "Ouvrir le guide simple",
        "explain": "Expliquer ce niveau",
        "close": "Fermer",
        "foundationTitle": "D0 part d’Ethereum",
        "foundationBody": "Aucun administrateur supplémentaire ne peut réécrire le mécanisme examiné. D1 ajoute des réglages limités ; les niveaux suivants ajoutent des pouvoirs sur les règles, la validation ou les réserves.",
        "dependencyTitle": "Suivez chaque dépendance",
        "dependencyBody": "Un actif hérite du pouvoir le plus fort de sa chaîne, de son app et de son émetteur. ETH dans un rollup D5 est D5. Un jeton contrôlé par son émetteur reste D9 sur Ethereum.",
        "unknownTitle": "Comprenez les inconnues",
        "unknownBody": "D? signifie que l’examen est incomplet. ≥D5 veut dire au moins D5 : une dépendance non résolue peut ajouter des pouvoirs. Ce n’est pas un verdict de sécurité.",
        "judgmentTitle": "Des pouvoirs, pas un verdict",
        "judgmentBody": "Un guide éditorial du contrôle, pas une note de sécurité, une prévision de rendement ou un jugement moral. Consultez les preuves et leur date.",
        "spectrum": "Explorer le spectre",
        "evidence": "Preuves et limites",
        "l1": "Un terrain ouvert à tous. Même les plus grandes institutions tiennent mieux sur des fondations communes."
    },
    "pt": {
        "tiers": [
            {
                "label": "Descentralização máxima",
                "definition": "Sem controle privilegiado adicional do principal ou da saída em relação ao Ethereum L1, no escopo revisado.",
                "legend": "Descentralização máxima"
            },
            {
                "label": "Administração limitada",
                "definition": "Ajustes limitados, sem poder conhecido para movimentar arbitrariamente o principal.",
                "legend": "Ajustes limitados; custódia e saída fixas"
            },
            {
                "label": "Operação externa",
                "definition": "Depende de poderes operacionais externos: oráculos, alocadores ou pausas.",
                "legend": "Oráculos, alocação ou pausas externas"
            },
            {
                "label": "Governança com atraso",
                "definition": "A governança pode alterar o sistema, com atraso obrigatório documentado para mudanças comuns.",
                "legend": "Mudanças por governança com atraso"
            },
            {
                "label": "Conselho emergencial independente",
                "definition": "Um conselho eleito e responsável pode agir em emergência; mudanças comuns têm atraso.",
                "legend": "Conselho independente; poderes de emergência"
            },
            {
                "label": "Conselho e fundação",
                "definition": "Conselho formal e fundação compartilham atualizações imediatas, com poderes de contingência da fundação.",
                "legend": "Autoridade do conselho e da fundação"
            },
            {
                "label": "Conselho e operador",
                "definition": "Conselho indicado e operador controlam atualizações imediatas; a remoção pública é limitada.",
                "legend": "Conselho nomeado e operador"
            },
            {
                "label": "Atualização administrativa",
                "definition": "Administrador concentrado pode atualizar o sistema sem atraso eficaz ou veto independente verificados.",
                "legend": "Administrador pode substituir as regras"
            },
            {
                "label": "Validação controlada pelo operador",
                "definition": "O operador controla quem valida ou contesta e pode limitar a inclusão forçada.",
                "legend": "Operador controla validação ou saídas"
            },
            {
                "label": "Lastro controlado pelo emissor",
                "definition": "Emissor ou custodiante controla reservas externas, resgate ou congelamento de ativos.",
                "legend": "Emissor controla lastro ou resgate"
            }
        ],
        "guideTitle": "Entenda D0–D9",
        "guideQuestion": "Quem pode mudar as regras?",
        "guideIntro": "Imagine Ethereum como um terreno comum e cada app como um edifício. D indica quanta autoridade extra existe entre você e esse terreno.",
        "guideAction": "Abrir o guia simples",
        "explain": "Explicar esta classificação",
        "close": "Fechar",
        "foundationTitle": "D0 começa no Ethereum",
        "foundationBody": "Nenhum administrador extra pode reescrever o mecanismo analisado. D1 acrescenta ajustes limitados; níveis maiores acrescentam poder sobre regras, validação ou lastro.",
        "dependencyTitle": "Siga cada dependência",
        "dependencyBody": "O ativo herda a autoridade mais forte de sua rede, app e emissor. ETH num rollup D5 é D5. Um token controlado pelo emissor continua D9 no Ethereum.",
        "unknownTitle": "Entenda as incógnitas",
        "unknownBody": "D? indica análise incompleta. ≥D5 significa pelo menos D5: uma dependência pendente pode acrescentar autoridade. Não é um veredito de segurança.",
        "judgmentTitle": "Autoridade, não um veredito",
        "judgmentBody": "Guia editorial de controle, não nota de segurança, previsão de retorno ou classificação moral. Consulte as evidências e suas datas.",
        "spectrum": "Explore o espectro",
        "evidence": "Evidências e limites",
        "l1": "Terreno aberto para todos. Até as maiores instituições ficam mais firmes sobre uma base compartilhada."
    },
    "de": {
        "tiers": [
            {
                "label": "Maximale Dezentralisierung",
                "definition": "Keine zusätzliche privilegierte Kontrolle über Kapital oder Ausstieg gegenüber Ethereum L1 im geprüften Umfang.",
                "legend": "Maximale Dezentralisierung"
            },
            {
                "label": "Begrenzte Verwaltung",
                "definition": "Begrenzte Einstellungen, ohne bekannte Befugnis zur beliebigen Bewegung des Kapitals.",
                "legend": "Begrenzte Einstellungen; Verwahrung und Ausstieg fest"
            },
            {
                "label": "Externer Betrieb",
                "definition": "Abhängig von externen Betriebsrechten: Orakel, Allokation oder Pausen.",
                "legend": "Externe Orakel, Zuteilung oder Pausen"
            },
            {
                "label": "Governance mit Verzögerung",
                "definition": "Governance kann das System ändern; normale Änderungen haben eine dokumentierte, erzwungene Verzögerung.",
                "legend": "Regeländerungen durch verzögerte Governance"
            },
            {
                "label": "Unabhängiger Notfallrat",
                "definition": "Ein gewählter, rechenschaftspflichtiger Rat kann im Notfall handeln; normale Änderungen sind verzögert.",
                "legend": "Unabhängiger Rat; Notfallbefugnisse"
            },
            {
                "label": "Rat und Stiftung",
                "definition": "Formeller Rat und Stiftung teilen sofortige Upgrades, mit Rückfallbefugnissen der Stiftung.",
                "legend": "Rat und Stiftung teilen Befugnisse"
            },
            {
                "label": "Rat und Betreiber",
                "definition": "Ernannter Rat und Betreiber kontrollieren sofortige Upgrades; öffentliche Abberufung ist begrenzt.",
                "legend": "Ernannter Rat und Betreiber"
            },
            {
                "label": "Administrator-Upgrade",
                "definition": "Konzentrierte Administration kann Upgrades durchführen; wirksame Verzögerung oder unabhängiges Veto sind ungeprüft.",
                "legend": "Administrator kann Kernregeln ersetzen"
            },
            {
                "label": "Betreiberbestimmte Validierung",
                "definition": "Der Betreiber kontrolliert den Zugang zur Validierung oder Anfechtung und kann erzwungene Aufnahme begrenzen.",
                "legend": "Betreiber kontrolliert Validierung oder Ausstieg"
            },
            {
                "label": "Emittentenkontrollierte Deckung",
                "definition": "Emittent oder Verwahrer kontrolliert externe Reserven, Rücknahme oder Einfrieren von Werten.",
                "legend": "Emittent kontrolliert Deckung oder Rücknahme"
            }
        ],
        "guideTitle": "D0–D9 verstehen",
        "guideQuestion": "Wer kann die Regeln ändern?",
        "guideIntro": "Ethereum ist wie gemeinsamer Baugrund, jede App ein Gebäude darauf. D zeigt die zusätzliche Entscheidungsgewalt zwischen dir und diesem Grund.",
        "guideAction": "Einfache Erklärung öffnen",
        "explain": "Diese Einstufung erklären",
        "close": "Schließen",
        "foundationTitle": "D0 beginnt bei Ethereum",
        "foundationBody": "Kein zusätzlicher Administrator kann den geprüften Mechanismus umschreiben. D1 ergänzt begrenzte Einstellungen; höhere Stufen ergänzen Macht über Regeln, Validierung oder Deckung.",
        "dependencyTitle": "Jeder Abhängigkeit folgen",
        "dependencyBody": "Ein Vermögenswert übernimmt die stärkste Macht in seiner Kette, App und beim Emittenten. ETH in einem D5-Rollup ist D5. Ein emittentenkontrollierter Token bleibt auf Ethereum D9.",
        "unknownTitle": "Fragezeichen verstehen",
        "unknownBody": "D? bedeutet unvollständige Prüfung. ≥D5 bedeutet mindestens D5: ungeprüfte Abhängigkeiten können weitere Macht hinzufügen. Beides ist kein Sicherheitsurteil.",
        "judgmentTitle": "Macht, kein Werturteil",
        "judgmentBody": "Eine redaktionelle Hilfe zu Kontrolle, keine Sicherheitsnote, Renditeprognose oder Rangliste guter und schlechter Projekte. Belege und Prüfdatum zählen.",
        "spectrum": "Spektrum erkunden",
        "evidence": "Belege und Grenzen",
        "l1": "Offener Grund für alle. Auch die größten Institutionen stehen stärker auf einem gemeinsamen Fundament."
    }
};
//# sourceMappingURL=locales.js.map