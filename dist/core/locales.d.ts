export declare const locales: {
    readonly en: {
        readonly tiers: readonly [{
            readonly label: "Maximum decentralization";
            readonly definition: "As decentralized as Ethereum L1 itself within the reviewed mechanism; no additional administrator can rewrite its principal or exit rules.";
            readonly legend: "Maximum decentralization";
        }, {
            readonly label: "Limited administration";
            readonly definition: "Bounded settings can change, while the reviewed asset custody and exit mechanism remains fixed.";
            readonly legend: "Limited settings; custody & exits fixed";
        }, {
            readonly label: "External operation";
            readonly definition: "An oracle, allocation role, pause or other external operation materially affects the position without arbitrary replacement of its core.";
            readonly legend: "External oracles, allocation or pauses";
        }, {
            readonly label: "Delayed governance";
            readonly definition: "Governance can change the system through a documented delay; user vetoes and exit protections are assessed explicitly.";
            readonly legend: "Rule changes through delayed governance";
        }, {
            readonly label: "Independent emergency council";
            readonly definition: "An elected, accountable and diverse council can act immediately, alongside a delayed normal governance route.";
            readonly legend: "Independent council; emergency powers";
        }, {
            readonly label: "Council and foundation";
            readonly definition: "A formally governed council shares immediate authority with a foundation, with additional foundation or fallback powers.";
            readonly legend: "Council + foundation authority";
        }, {
            readonly label: "Council and operator";
            readonly definition: "An operator shares immediate authority with an appointed council, with limited public governance or removal rights.";
            readonly legend: "Appointed council + operator authority";
        }, {
            readonly label: "Administrator upgrade";
            readonly definition: "A concentrated administrator or committee can replace core rules without a verified protective delay and independent veto.";
            readonly legend: "Administrator can replace core rules";
        }, {
            readonly label: "Operator-governed validation";
            readonly definition: "The operator also restricts who may validate or challenge state, or can defeat ordinary inclusion or exit mechanisms.";
            readonly legend: "Operator also controls validation or exits";
        }, {
            readonly label: "Issuer-controlled backing";
            readonly definition: "An issuer or custodian controls the backing, redemption or seizure of the asset. This dimension is additional to the chain it uses.";
            readonly legend: "Issuer controls backing or redemption";
        }];
        readonly guideTitle: "Your guide to D0–D9";
        readonly guideQuestion: "Who can change the rules?";
        readonly guideIntro: "Imagine Ethereum as shared ground, and each app as a building on it. A D-number tells you how much extra authority sits between you and that ground.";
        readonly guideAction: "Open the plain-language guide";
        readonly explain: "Explain this rating";
        readonly close: "Close";
        readonly foundationTitle: "D0 starts at Ethereum";
        readonly foundationBody: "No extra administrator can rewrite the reviewed mechanism. D1 adds bounded settings; higher levels add stronger powers over rules, validation or backing.";
        readonly dependencyTitle: "Follow every dependency";
        readonly dependencyBody: "An asset carries the strongest authority along its chain, app and issuer path. ETH in a D5 rollup is D5. An issuer-controlled token remains D9 even on Ethereum.";
        readonly unknownTitle: "Read the question marks";
        readonly unknownBody: "D? means the review is incomplete. ≥D5 means at least D5: an unresolved dependency may add more authority. Neither means safe or unsafe.";
        readonly judgmentTitle: "Authority, not a verdict";
        readonly judgmentBody: "This is an editorial guide to control, not a security score, return forecast or ranking of good and bad projects. The evidence and review date matter.";
        readonly spectrum: "Explore the spectrum";
        readonly evidence: "Evidence and limits";
        readonly l1: "Open ground for everyone. Even the tallest institutions stand stronger on a shared foundation.";
    };
    readonly zh: {
        readonly tiers: readonly [{
            readonly label: "最大程度去中心化";
            readonly definition: "在评估范围内，没有比以太坊 L1 额外的特权主体控制本金或退出。";
            readonly legend: "最大去中心化";
        }, {
            readonly label: "有限管理";
            readonly definition: "管理员只能调整有边界的参数，没有已知任意转移本金的权限。";
            readonly legend: "有限设置；托管与退出规则固定";
        }, {
            readonly label: "外部运营";
            readonly definition: "依赖预言机、分配者或暂停等外部运营权限。";
            readonly legend: "外部预言机、分配或暂停权限";
        }, {
            readonly label: "有延迟的治理";
            readonly definition: "治理可更改系统，但普通变更有公开记录的强制延迟。";
            readonly legend: "治理变更须经过延迟期";
        }, {
            readonly label: "独立紧急委员会";
            readonly definition: "选举产生且可问责的委员会可紧急升级；普通变更有延迟。";
            readonly legend: "独立委员会拥有紧急权限";
        }, {
            readonly label: "委员会与基金会";
            readonly definition: "正式委员会与基金会共同保有即时升级权限，存在基金会后备权力。";
            readonly legend: "委员会与基金会共享权限";
        }, {
            readonly label: "委员会与运营方";
            readonly definition: "指定的委员会与运营方共同控制即时升级，公开罢免机制有限。";
            readonly legend: "指定委员会与运营方共享权限";
        }, {
            readonly label: "管理员升级";
            readonly definition: "集中式管理员可升级系统，未核实有效延迟或独立否决机制。";
            readonly legend: "管理员可替换核心规则";
        }, {
            readonly label: "运营方控制验证";
            readonly definition: "运营方还控制验证者或挑战者准入，可能限制强制纳入交易。";
            readonly legend: "运营方还控制验证或退出";
        }, {
            readonly label: "发行方控制储备";
            readonly definition: "发行方或托管方可控制链外储备、赎回或冻结资产。";
            readonly legend: "发行方控制储备或赎回";
        }];
        readonly guideTitle: "D0–D9 入门指南";
        readonly guideQuestion: "谁能改变规则？";
        readonly guideIntro: "把以太坊想成共同的地基，每个应用都是上面的建筑。D 值说明你与地基之间增加了多少控制权。";
        readonly guideAction: "打开通俗指南";
        readonly explain: "解释此评级";
        readonly close: "关闭";
        readonly foundationTitle: "D0 以以太坊为基准";
        readonly foundationBody: "没有额外管理员能改写已评估机制。D1 增加有限设置；更高等级增加规则、验证或资产支持方面的权力。";
        readonly dependencyTitle: "追踪每一层依赖";
        readonly dependencyBody: "资产继承所在链、应用和发行方中最强的控制权。D5 网络中的 ETH 为 D5；发行方控制的代币即使在以太坊上仍是 D9。";
        readonly unknownTitle: "理解问号";
        readonly unknownBody: "D? 表示评估未完成。≥D5 表示至少为 D5，未确定的依赖可能增加控制权。两者都不是安全结论。";
        readonly judgmentTitle: "控制权，而非好坏结论";
        readonly judgmentBody: "这是控制权的编辑性指南，不是安全评分、回报预测或项目优劣排名。请查看证据和评估日期。";
        readonly spectrum: "查看完整光谱";
        readonly evidence: "证据与局限";
        readonly l1: "人人共享的开放地基。再高的机构，也因共同的基础而更加稳固。";
    };
    readonly es: {
        readonly tiers: readonly [{
            readonly label: "Máxima descentralización";
            readonly definition: "Sin control privilegiado adicional del principal o de la salida respecto a Ethereum L1, en el ámbito revisado.";
            readonly legend: "Máxima descentralización";
        }, {
            readonly label: "Administración limitada";
            readonly definition: "Permite ajustar parámetros acotados, sin un poder conocido para mover arbitrariamente el principal.";
            readonly legend: "Ajustes limitados; custodia y salida fijas";
        }, {
            readonly label: "Operación externa";
            readonly definition: "Depende de poderes operativos externos: oráculos, asignadores o pausas.";
            readonly legend: "Oráculos, asignación o pausas externas";
        }, {
            readonly label: "Gobernanza con demora";
            readonly definition: "La gobernanza puede modificar el sistema, con una demora obligatoria documentada para cambios ordinarios.";
            readonly legend: "Cambios mediante gobernanza con demora";
        }, {
            readonly label: "Consejo de emergencia independiente";
            readonly definition: "Un consejo elegido y responsable puede actuar de emergencia; los cambios ordinarios tienen demora.";
            readonly legend: "Consejo independiente; poderes de emergencia";
        }, {
            readonly label: "Consejo y fundación";
            readonly definition: "Un consejo formal y una fundación comparten actualizaciones inmediatas, con facultades de respaldo de la fundación.";
            readonly legend: "Autoridad del consejo y la fundación";
        }, {
            readonly label: "Consejo y operador";
            readonly definition: "Un consejo designado y un operador controlan actualizaciones inmediatas, con destitución pública limitada.";
            readonly legend: "Consejo designado y operador";
        }, {
            readonly label: "Actualización administrativa";
            readonly definition: "Un administrador concentrado puede actualizar el sistema sin demora eficaz o veto independiente verificados.";
            readonly legend: "Un administrador puede sustituir las reglas";
        }, {
            readonly label: "Validación dirigida por el operador";
            readonly definition: "El operador controla quién valida o impugna, y puede limitar la inclusión forzada.";
            readonly legend: "El operador controla validación o salidas";
        }, {
            readonly label: "Respaldo controlado por el emisor";
            readonly definition: "Un emisor o custodio controla reservas externas, reembolsos o congelación de activos.";
            readonly legend: "El emisor controla respaldo o reembolso";
        }];
        readonly guideTitle: "Guía de D0–D9";
        readonly guideQuestion: "¿Quién puede cambiar las reglas?";
        readonly guideIntro: "Imagina Ethereum como un terreno compartido y cada app como un edificio. D indica cuánta autoridad adicional existe entre tú y ese terreno.";
        readonly guideAction: "Abrir la guía sencilla";
        readonly explain: "Explicar esta categoría";
        readonly close: "Cerrar";
        readonly foundationTitle: "D0 parte de Ethereum";
        readonly foundationBody: "Ningún administrador adicional puede reescribir el mecanismo evaluado. D1 añade ajustes limitados; los niveles mayores añaden poder sobre reglas, validación o respaldo.";
        readonly dependencyTitle: "Sigue cada dependencia";
        readonly dependencyBody: "El activo hereda la autoridad más fuerte de su cadena, app y emisor. ETH en un rollup D5 es D5. Un token controlado por su emisor sigue siendo D9 en Ethereum.";
        readonly unknownTitle: "Interpreta las incógnitas";
        readonly unknownBody: "D? indica una evaluación incompleta. ≥D5 significa al menos D5: otra dependencia puede añadir autoridad. No es un juicio de seguridad.";
        readonly judgmentTitle: "Autoridad, no un veredicto";
        readonly judgmentBody: "Una guía editorial del control, no una puntuación de seguridad, previsión de rentabilidad ni clasificación moral. Consulta las pruebas y su fecha.";
        readonly spectrum: "Explora el espectro";
        readonly evidence: "Pruebas y límites";
        readonly l1: "Terreno abierto para todos. Incluso las instituciones más altas se sostienen mejor sobre cimientos compartidos.";
    };
    readonly ja: {
        readonly tiers: readonly [{
            readonly label: "最大の分散性";
            readonly definition: "評価範囲で、Ethereum L1以外に元本や退出を管理する特権主体はありません。";
            readonly legend: "最大の分散性";
        }, {
            readonly label: "限定的な管理";
            readonly definition: "管理者は限定された設定を変更できますが、任意に元本を動かす権限は確認されていません。";
            readonly legend: "設定変更は限定的；保管と退出の仕組みは固定";
        }, {
            readonly label: "外部の運用";
            readonly definition: "オラクル、資産配分、停止など外部の運用権限に依存します。";
            readonly legend: "外部オラクル・配分・停止の権限";
        }, {
            readonly label: "遅延付きガバナンス";
            readonly definition: "システム変更が可能ですが、通常の変更には文書化された強制待機期間があります。";
            readonly legend: "遅延期間を伴うガバナンスによる変更";
        }, {
            readonly label: "独立した緊急評議会";
            readonly definition: "選挙と説明責任のある評議会が緊急更新でき、通常の変更には遅延があります。";
            readonly legend: "独立評議会による緊急権限";
        }, {
            readonly label: "評議会と財団";
            readonly definition: "正式な評議会と財団が即時更新を共同管理し、財団へのフォールバックがあります。";
            readonly legend: "評議会と財団の共同権限";
        }, {
            readonly label: "評議会と運営者";
            readonly definition: "任命された評議会と運営者が即時更新を共同管理し、公的な解任権は限定的です。";
            readonly legend: "任命評議会と運営者の共同権限";
        }, {
            readonly label: "管理者による更新";
            readonly definition: "集中した管理者が更新でき、有効な遅延や独立した拒否権は未確認です。";
            readonly legend: "管理者が中核ルールを変更可能";
        }, {
            readonly label: "運営者が検証を管理";
            readonly definition: "運営者は検証者・異議申立者の参加も制限し、強制包含を制限する場合があります。";
            readonly legend: "運営者が検証や退出も制御";
        }, {
            readonly label: "発行者が裏付けを管理";
            readonly definition: "発行者や保管者がオフチェーンの準備資産、償還、凍結を管理できます。";
            readonly legend: "発行者が裏付け資産や償還を制御";
        }];
        readonly guideTitle: "D0–D9 のやさしいガイド";
        readonly guideQuestion: "ルールを変えられるのは誰？";
        readonly guideIntro: "Ethereum を共有の土地、アプリをその上の建物と考えてください。D は、あなたと土台の間に加わる権限を表します。";
        readonly guideAction: "やさしいガイドを開く";
        readonly explain: "この評価を説明";
        readonly close: "閉じる";
        readonly foundationTitle: "D0 は Ethereum が基準";
        readonly foundationBody: "評価対象の仕組みを書き換える追加の管理者はいません。D1 は限定的な設定、より高い段階はルール・検証・裏付けへの権限を加えます。";
        readonly dependencyTitle: "すべての依存先をたどる";
        readonly dependencyBody: "資産はチェーン・アプリ・発行者のうち最も強い権限を引き継ぎます。D5 のロールアップ上の ETH は D5。発行者管理のトークンは Ethereum 上でも D9 です。";
        readonly unknownTitle: "疑問符の読み方";
        readonly unknownBody: "D? は評価未完了。≥D5 は少なくとも D5 で、未確認の依存先が権限を加える可能性があります。安全性の判定ではありません。";
        readonly judgmentTitle: "権限の説明であり、優劣の判定ではありません";
        readonly judgmentBody: "管理権限の編集的ガイドです。安全性の点数、収益予測、善悪の順位ではありません。根拠と評価日を確認してください。";
        readonly spectrum: "全体を見る";
        readonly evidence: "根拠と限界";
        readonly l1: "誰にでも開かれた大地。大きな組織も、共有の土台でいっそう強く立てます。";
    };
    readonly ko: {
        readonly tiers: readonly [{
            readonly label: "최대 탈중앙화";
            readonly definition: "평가 범위에서 이더리움 L1 외에 원금이나 출금을 통제하는 특권 주체가 없습니다.";
            readonly legend: "최대 탈중앙화";
        }, {
            readonly label: "제한된 관리";
            readonly definition: "관리자는 제한된 설정만 변경하며 원금을 임의로 옮기는 권한은 확인되지 않았습니다.";
            readonly legend: "제한된 설정; 보관·출금 규칙 고정";
        }, {
            readonly label: "외부 운영";
            readonly definition: "오라클, 배분자 또는 일시 중지 같은 외부 운영 권한에 의존합니다.";
            readonly legend: "외부 오라클·배분·일시 중지 권한";
        }, {
            readonly label: "지연이 있는 거버넌스";
            readonly definition: "시스템 변경이 가능하나 일반 변경에는 문서화된 강제 지연이 있습니다.";
            readonly legend: "지연 기간을 둔 거버넌스 변경";
        }, {
            readonly label: "독립적 긴급 위원회";
            readonly definition: "선출되고 책임을 지는 위원회가 긴급 업그레이드를 수행하며 일반 변경에는 지연이 있습니다.";
            readonly legend: "독립 위원회의 긴급 권한";
        }, {
            readonly label: "위원회와 재단";
            readonly definition: "공식 위원회와 재단이 즉시 업그레이드를 공동 통제하며 재단 대체 권한이 있습니다.";
            readonly legend: "위원회와 재단의 공동 권한";
        }, {
            readonly label: "위원회와 운영자";
            readonly definition: "임명된 위원회와 운영자가 즉시 업그레이드를 통제하며 공개 해임 수단은 제한됩니다.";
            readonly legend: "지명 위원회와 운영자의 공동 권한";
        }, {
            readonly label: "관리자 업그레이드";
            readonly definition: "집중된 관리자가 업그레이드하며 유효한 지연이나 독립적 거부권은 미확인입니다.";
            readonly legend: "관리자가 핵심 규칙 교체 가능";
        }, {
            readonly label: "운영자 주도 검증";
            readonly definition: "운영자는 검증자나 이의 제기자 참여를 제한하고 강제 거래 포함도 제한할 수 있습니다.";
            readonly legend: "운영자가 검증이나 출금도 통제";
        }, {
            readonly label: "발행자 주도 담보";
            readonly definition: "발행자나 수탁자가 오프체인 준비금, 상환 또는 자산 동결을 통제할 수 있습니다.";
            readonly legend: "발행자가 담보나 상환 통제";
        }];
        readonly guideTitle: "D0–D9 쉽게 이해하기";
        readonly guideQuestion: "누가 규칙을 바꿀 수 있나요?";
        readonly guideIntro: "이더리움을 공동의 땅, 앱을 그 위의 건물이라고 생각하세요. D는 나와 기반 사이에 추가된 권한을 보여 줍니다.";
        readonly guideAction: "쉬운 안내 열기";
        readonly explain: "이 등급 설명";
        readonly close: "닫기";
        readonly foundationTitle: "D0는 이더리움이 기준";
        readonly foundationBody: "검토된 구조를 바꿀 추가 관리자가 없습니다. D1은 제한된 설정을, 더 높은 단계는 규칙·검증·담보에 대한 권한을 더합니다.";
        readonly dependencyTitle: "모든 의존 관계 따라가기";
        readonly dependencyBody: "자산은 체인·앱·발행자 중 가장 강한 권한을 상속합니다. D5 롤업의 ETH는 D5입니다. 발행자가 통제하는 토큰은 이더리움에서도 D9입니다.";
        readonly unknownTitle: "물음표 이해하기";
        readonly unknownBody: "D?는 검토 미완료입니다. ≥D5는 최소 D5이며 미확인 의존 관계가 권한을 더할 수 있습니다. 안전성 판정은 아닙니다.";
        readonly judgmentTitle: "권한 설명이지 가치 판단이 아닙니다";
        readonly judgmentBody: "통제에 대한 편집적 안내입니다. 보안 점수, 수익 예측, 선악 순위가 아닙니다. 근거와 검토 날짜를 확인하세요.";
        readonly spectrum: "전체 스펙트럼 보기";
        readonly evidence: "근거와 한계";
        readonly l1: "모두에게 열린 땅. 아무리 큰 기관도 함께 쓰는 기반 위에서 더 단단히 섭니다.";
    };
    readonly fr: {
        readonly tiers: readonly [{
            readonly label: "Décentralisation maximale";
            readonly definition: "Aucun contrôle privilégié supplémentaire du capital ou de la sortie par rapport à Ethereum L1, dans le périmètre examiné.";
            readonly legend: "Décentralisation maximale";
        }, {
            readonly label: "Administration limitée";
            readonly definition: "Réglages bornés, sans pouvoir connu de déplacer arbitrairement le capital.";
            readonly legend: "Réglages limités ; garde et sortie fixes";
        }, {
            readonly label: "Opération externe";
            readonly definition: "Dépend de pouvoirs opérationnels externes : oracles, allocateurs ou pauses.";
            readonly legend: "Oracles, allocation ou pauses externes";
        }, {
            readonly label: "Gouvernance avec délai";
            readonly definition: "La gouvernance peut modifier le système, avec un délai obligatoire documenté pour les changements ordinaires.";
            readonly legend: "Modifications par gouvernance avec délai";
        }, {
            readonly label: "Conseil d’urgence indépendant";
            readonly definition: "Un conseil élu et responsable peut agir en urgence ; les changements ordinaires sont retardés.";
            readonly legend: "Conseil indépendant ; pouvoirs d’urgence";
        }, {
            readonly label: "Conseil et fondation";
            readonly definition: "Un conseil formel et une fondation partagent les mises à niveau immédiates, avec des pouvoirs de repli de la fondation.";
            readonly legend: "Autorité du conseil et de la fondation";
        }, {
            readonly label: "Conseil et opérateur";
            readonly definition: "Un conseil nommé et un opérateur contrôlent les mises à niveau immédiates ; la révocation publique est limitée.";
            readonly legend: "Conseil nommé et opérateur";
        }, {
            readonly label: "Mise à niveau administrative";
            readonly definition: "Un administrateur concentré peut modifier le système, sans délai efficace ni veto indépendant vérifiés.";
            readonly legend: "L’administrateur peut remplacer les règles";
        }, {
            readonly label: "Validation régie par l’opérateur";
            readonly definition: "L’opérateur contrôle l’admission des validateurs ou contestataires et peut limiter l’inclusion forcée.";
            readonly legend: "L’opérateur contrôle validation ou sorties";
        }, {
            readonly label: "Réserves régies par l’émetteur";
            readonly definition: "L’émetteur ou le dépositaire contrôle les réserves hors chaîne, le rachat ou le gel des actifs.";
            readonly legend: "L’émetteur contrôle réserves ou rachat";
        }];
        readonly guideTitle: "Comprendre D0–D9";
        readonly guideQuestion: "Qui peut changer les règles ?";
        readonly guideIntro: "Imaginez Ethereum comme un terrain commun, et chaque app comme un bâtiment. D indique les pouvoirs supplémentaires entre vous et ce terrain.";
        readonly guideAction: "Ouvrir le guide simple";
        readonly explain: "Expliquer ce niveau";
        readonly close: "Fermer";
        readonly foundationTitle: "D0 part d’Ethereum";
        readonly foundationBody: "Aucun administrateur supplémentaire ne peut réécrire le mécanisme examiné. D1 ajoute des réglages limités ; les niveaux suivants ajoutent des pouvoirs sur les règles, la validation ou les réserves.";
        readonly dependencyTitle: "Suivez chaque dépendance";
        readonly dependencyBody: "Un actif hérite du pouvoir le plus fort de sa chaîne, de son app et de son émetteur. ETH dans un rollup D5 est D5. Un jeton contrôlé par son émetteur reste D9 sur Ethereum.";
        readonly unknownTitle: "Comprenez les inconnues";
        readonly unknownBody: "D? signifie que l’examen est incomplet. ≥D5 veut dire au moins D5 : une dépendance non résolue peut ajouter des pouvoirs. Ce n’est pas un verdict de sécurité.";
        readonly judgmentTitle: "Des pouvoirs, pas un verdict";
        readonly judgmentBody: "Un guide éditorial du contrôle, pas une note de sécurité, une prévision de rendement ou un jugement moral. Consultez les preuves et leur date.";
        readonly spectrum: "Explorer le spectre";
        readonly evidence: "Preuves et limites";
        readonly l1: "Un terrain ouvert à tous. Même les plus grandes institutions tiennent mieux sur des fondations communes.";
    };
    readonly pt: {
        readonly tiers: readonly [{
            readonly label: "Descentralização máxima";
            readonly definition: "Sem controle privilegiado adicional do principal ou da saída em relação ao Ethereum L1, no escopo revisado.";
            readonly legend: "Descentralização máxima";
        }, {
            readonly label: "Administração limitada";
            readonly definition: "Ajustes limitados, sem poder conhecido para movimentar arbitrariamente o principal.";
            readonly legend: "Ajustes limitados; custódia e saída fixas";
        }, {
            readonly label: "Operação externa";
            readonly definition: "Depende de poderes operacionais externos: oráculos, alocadores ou pausas.";
            readonly legend: "Oráculos, alocação ou pausas externas";
        }, {
            readonly label: "Governança com atraso";
            readonly definition: "A governança pode alterar o sistema, com atraso obrigatório documentado para mudanças comuns.";
            readonly legend: "Mudanças por governança com atraso";
        }, {
            readonly label: "Conselho emergencial independente";
            readonly definition: "Um conselho eleito e responsável pode agir em emergência; mudanças comuns têm atraso.";
            readonly legend: "Conselho independente; poderes de emergência";
        }, {
            readonly label: "Conselho e fundação";
            readonly definition: "Conselho formal e fundação compartilham atualizações imediatas, com poderes de contingência da fundação.";
            readonly legend: "Autoridade do conselho e da fundação";
        }, {
            readonly label: "Conselho e operador";
            readonly definition: "Conselho indicado e operador controlam atualizações imediatas; a remoção pública é limitada.";
            readonly legend: "Conselho nomeado e operador";
        }, {
            readonly label: "Atualização administrativa";
            readonly definition: "Administrador concentrado pode atualizar o sistema sem atraso eficaz ou veto independente verificados.";
            readonly legend: "Administrador pode substituir as regras";
        }, {
            readonly label: "Validação controlada pelo operador";
            readonly definition: "O operador controla quem valida ou contesta e pode limitar a inclusão forçada.";
            readonly legend: "Operador controla validação ou saídas";
        }, {
            readonly label: "Lastro controlado pelo emissor";
            readonly definition: "Emissor ou custodiante controla reservas externas, resgate ou congelamento de ativos.";
            readonly legend: "Emissor controla lastro ou resgate";
        }];
        readonly guideTitle: "Entenda D0–D9";
        readonly guideQuestion: "Quem pode mudar as regras?";
        readonly guideIntro: "Imagine Ethereum como um terreno comum e cada app como um edifício. D indica quanta autoridade extra existe entre você e esse terreno.";
        readonly guideAction: "Abrir o guia simples";
        readonly explain: "Explicar esta classificação";
        readonly close: "Fechar";
        readonly foundationTitle: "D0 começa no Ethereum";
        readonly foundationBody: "Nenhum administrador extra pode reescrever o mecanismo analisado. D1 acrescenta ajustes limitados; níveis maiores acrescentam poder sobre regras, validação ou lastro.";
        readonly dependencyTitle: "Siga cada dependência";
        readonly dependencyBody: "O ativo herda a autoridade mais forte de sua rede, app e emissor. ETH num rollup D5 é D5. Um token controlado pelo emissor continua D9 no Ethereum.";
        readonly unknownTitle: "Entenda as incógnitas";
        readonly unknownBody: "D? indica análise incompleta. ≥D5 significa pelo menos D5: uma dependência pendente pode acrescentar autoridade. Não é um veredito de segurança.";
        readonly judgmentTitle: "Autoridade, não um veredito";
        readonly judgmentBody: "Guia editorial de controle, não nota de segurança, previsão de retorno ou classificação moral. Consulte as evidências e suas datas.";
        readonly spectrum: "Explore o espectro";
        readonly evidence: "Evidências e limites";
        readonly l1: "Terreno aberto para todos. Até as maiores instituições ficam mais firmes sobre uma base compartilhada.";
    };
    readonly de: {
        readonly tiers: readonly [{
            readonly label: "Maximale Dezentralisierung";
            readonly definition: "Keine zusätzliche privilegierte Kontrolle über Kapital oder Ausstieg gegenüber Ethereum L1 im geprüften Umfang.";
            readonly legend: "Maximale Dezentralisierung";
        }, {
            readonly label: "Begrenzte Verwaltung";
            readonly definition: "Begrenzte Einstellungen, ohne bekannte Befugnis zur beliebigen Bewegung des Kapitals.";
            readonly legend: "Begrenzte Einstellungen; Verwahrung und Ausstieg fest";
        }, {
            readonly label: "Externer Betrieb";
            readonly definition: "Abhängig von externen Betriebsrechten: Orakel, Allokation oder Pausen.";
            readonly legend: "Externe Orakel, Zuteilung oder Pausen";
        }, {
            readonly label: "Governance mit Verzögerung";
            readonly definition: "Governance kann das System ändern; normale Änderungen haben eine dokumentierte, erzwungene Verzögerung.";
            readonly legend: "Regeländerungen durch verzögerte Governance";
        }, {
            readonly label: "Unabhängiger Notfallrat";
            readonly definition: "Ein gewählter, rechenschaftspflichtiger Rat kann im Notfall handeln; normale Änderungen sind verzögert.";
            readonly legend: "Unabhängiger Rat; Notfallbefugnisse";
        }, {
            readonly label: "Rat und Stiftung";
            readonly definition: "Formeller Rat und Stiftung teilen sofortige Upgrades, mit Rückfallbefugnissen der Stiftung.";
            readonly legend: "Rat und Stiftung teilen Befugnisse";
        }, {
            readonly label: "Rat und Betreiber";
            readonly definition: "Ernannter Rat und Betreiber kontrollieren sofortige Upgrades; öffentliche Abberufung ist begrenzt.";
            readonly legend: "Ernannter Rat und Betreiber";
        }, {
            readonly label: "Administrator-Upgrade";
            readonly definition: "Konzentrierte Administration kann Upgrades durchführen; wirksame Verzögerung oder unabhängiges Veto sind ungeprüft.";
            readonly legend: "Administrator kann Kernregeln ersetzen";
        }, {
            readonly label: "Betreiberbestimmte Validierung";
            readonly definition: "Der Betreiber kontrolliert den Zugang zur Validierung oder Anfechtung und kann erzwungene Aufnahme begrenzen.";
            readonly legend: "Betreiber kontrolliert Validierung oder Ausstieg";
        }, {
            readonly label: "Emittentenkontrollierte Deckung";
            readonly definition: "Emittent oder Verwahrer kontrolliert externe Reserven, Rücknahme oder Einfrieren von Werten.";
            readonly legend: "Emittent kontrolliert Deckung oder Rücknahme";
        }];
        readonly guideTitle: "D0–D9 verstehen";
        readonly guideQuestion: "Wer kann die Regeln ändern?";
        readonly guideIntro: "Ethereum ist wie gemeinsamer Baugrund, jede App ein Gebäude darauf. D zeigt die zusätzliche Entscheidungsgewalt zwischen dir und diesem Grund.";
        readonly guideAction: "Einfache Erklärung öffnen";
        readonly explain: "Diese Einstufung erklären";
        readonly close: "Schließen";
        readonly foundationTitle: "D0 beginnt bei Ethereum";
        readonly foundationBody: "Kein zusätzlicher Administrator kann den geprüften Mechanismus umschreiben. D1 ergänzt begrenzte Einstellungen; höhere Stufen ergänzen Macht über Regeln, Validierung oder Deckung.";
        readonly dependencyTitle: "Jeder Abhängigkeit folgen";
        readonly dependencyBody: "Ein Vermögenswert übernimmt die stärkste Macht in seiner Kette, App und beim Emittenten. ETH in einem D5-Rollup ist D5. Ein emittentenkontrollierter Token bleibt auf Ethereum D9.";
        readonly unknownTitle: "Fragezeichen verstehen";
        readonly unknownBody: "D? bedeutet unvollständige Prüfung. ≥D5 bedeutet mindestens D5: ungeprüfte Abhängigkeiten können weitere Macht hinzufügen. Beides ist kein Sicherheitsurteil.";
        readonly judgmentTitle: "Macht, kein Werturteil";
        readonly judgmentBody: "Eine redaktionelle Hilfe zu Kontrolle, keine Sicherheitsnote, Renditeprognose oder Rangliste guter und schlechter Projekte. Belege und Prüfdatum zählen.";
        readonly spectrum: "Spektrum erkunden";
        readonly evidence: "Belege und Grenzen";
        readonly l1: "Offener Grund für alle. Auch die größten Institutionen stehen stärker auf einem gemeinsamen Fundament.";
    };
};
export type Locale = keyof typeof locales;
//# sourceMappingURL=locales.d.ts.map