export { rubric } from './rubric.js';
export { locales, type Locale } from './locales.js';
import { type Locale } from './locales.js';
export type DLevel = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
export type SubjectKind = 'ethereum-l1' | 'mechanism' | 'position';
export interface Assessment {
    /** Complete effective grade; null when any material dependency is unknown. */
    effectiveLevel: DLevel | null;
    /** Largest established grade, even when effectiveLevel remains unknown. */
    knownFloor: DLevel | null;
    status: 'assessed' | 'partial' | 'unreviewed';
    unresolved: readonly string[];
    reviewedAt?: string;
}
export interface ControlReview {
    id: string;
    label: string;
    level: DLevel | null;
    complete?: boolean;
    dependencies?: readonly string[];
    reviewedAt?: string;
    evidence?: readonly string[];
}
export declare function isDLevel(value: unknown): value is DLevel;
export declare function normalizeLevel(value: unknown): DLevel | null;
export declare function levelColor(value: unknown): string;
export declare function grade(value: unknown): {
    readonly tier: 0;
    readonly label: "Maximum decentralization";
    readonly definition: "As decentralized as Ethereum L1 itself within the reviewed mechanism; no additional administrator can rewrite its principal or exit rules.";
    readonly id: "D0";
    readonly color: "#8bffff";
} | {
    readonly tier: 1;
    readonly label: "Limited administration";
    readonly definition: "Bounded settings can change, while the reviewed asset custody and exit mechanism remains fixed.";
    readonly id: "D1";
    readonly color: "#32ff81";
} | {
    readonly tier: 2;
    readonly label: "External operation";
    readonly definition: "An oracle, allocation role, pause or other external operation materially affects the position without arbitrary replacement of its core.";
    readonly id: "D2";
    readonly color: "#a8ff00";
} | {
    readonly tier: 3;
    readonly label: "Delayed governance";
    readonly definition: "Governance can change the system through a documented delay; user vetoes and exit protections are assessed explicitly.";
    readonly id: "D3";
    readonly color: "#e5ff00";
} | {
    readonly tier: 4;
    readonly label: "Independent emergency council";
    readonly definition: "An elected, accountable and diverse council can act immediately, alongside a delayed normal governance route.";
    readonly id: "D4";
    readonly color: "#fff000";
} | {
    readonly tier: 5;
    readonly label: "Council and foundation";
    readonly definition: "A formally governed council shares immediate authority with a foundation, with additional foundation or fallback powers.";
    readonly id: "D5";
    readonly color: "#ffbf00";
} | {
    readonly tier: 6;
    readonly label: "Council and operator";
    readonly definition: "An operator shares immediate authority with an appointed council, with limited public governance or removal rights.";
    readonly id: "D6";
    readonly color: "#ff8a24";
} | {
    readonly tier: 7;
    readonly label: "Administrator upgrade";
    readonly definition: "A concentrated administrator or committee can replace core rules without a verified protective delay and independent veto.";
    readonly id: "D7";
    readonly color: "#ff5c44";
} | {
    readonly tier: 8;
    readonly label: "Operator-governed validation";
    readonly definition: "The operator also restricts who may validate or challenge state, or can defeat ordinary inclusion or exit mechanisms.";
    readonly id: "D8";
    readonly color: "#ff405d";
} | {
    readonly tier: 9;
    readonly label: "Issuer-controlled backing";
    readonly definition: "An issuer or custodian controls the backing, redemption or seizure of the asset. This dimension is additional to the chain it uses.";
    readonly id: "D9";
    readonly color: "#ff3152";
} | null;
/** Treat host-supplied/serialized assessments as untrusted; never lower a known restriction. */
export declare function normalizeAssessment(value: unknown): Assessment;
export declare function assessment(level: DLevel | null, options?: {
    complete?: boolean;
    reviewedAt?: string;
    unresolved?: readonly string[];
}): Assessment;
/** A known positive restriction remains visible; an unknown never becomes D0. */
export declare function composeAssessments(values: readonly Assessment[]): Assessment;
export declare function displayedLevel(value: Assessment): DLevel | null;
export declare function levelLabel(value: Assessment | DLevel | null): string;
export declare function describeAssessment(value: Assessment, locale?: Locale, subject?: SubjectKind): {
    label: string;
    color: string;
    short: "Maximum Decentralization" | "Limited settings; custody & exits fixed" | "External oracles, allocation or pauses" | "Rule changes through delayed governance" | "Independent council; emergency powers" | "Council + foundation authority" | "Appointed council + operator authority" | "Administrator can replace core rules" | "Operator also controls validation or exits" | "Issuer controls backing or redemption" | "Read the question marks" | "最大去中心化" | "有限设置；托管与退出规则固定" | "外部预言机、分配或暂停权限" | "治理变更须经过延迟期" | "独立委员会拥有紧急权限" | "委员会与基金会共享权限" | "指定委员会与运营方共享权限" | "管理员可替换核心规则" | "运营方还控制验证或退出" | "发行方控制储备或赎回" | "理解问号" | "Máxima descentralización" | "Ajustes limitados; custodia y salida fijas" | "Oráculos, asignación o pausas externas" | "Cambios mediante gobernanza con demora" | "Consejo independiente; poderes de emergencia" | "Autoridad del consejo y la fundación" | "Consejo designado y operador" | "Un administrador puede sustituir las reglas" | "El operador controla validación o salidas" | "El emisor controla respaldo o reembolso" | "Interpreta las incógnitas" | "最大の分散性" | "設定変更は限定的；保管と退出の仕組みは固定" | "外部オラクル・配分・停止の権限" | "遅延期間を伴うガバナンスによる変更" | "独立評議会による緊急権限" | "評議会と財団の共同権限" | "任命評議会と運営者の共同権限" | "管理者が中核ルールを変更可能" | "運営者が検証や退出も制御" | "発行者が裏付け資産や償還を制御" | "疑問符の読み方" | "최대 탈중앙화" | "제한된 설정; 보관·출금 규칙 고정" | "외부 오라클·배분·일시 중지 권한" | "지연 기간을 둔 거버넌스 변경" | "독립 위원회의 긴급 권한" | "위원회와 재단의 공동 권한" | "지명 위원회와 운영자의 공동 권한" | "관리자가 핵심 규칙 교체 가능" | "운영자가 검증이나 출금도 통제" | "발행자가 담보나 상환 통제" | "물음표 이해하기" | "Décentralisation maximale" | "Réglages limités ; garde et sortie fixes" | "Oracles, allocation ou pauses externes" | "Modifications par gouvernance avec délai" | "Conseil indépendant ; pouvoirs d’urgence" | "Autorité du conseil et de la fondation" | "Conseil nommé et opérateur" | "L’administrateur peut remplacer les règles" | "L’opérateur contrôle validation ou sorties" | "L’émetteur contrôle réserves ou rachat" | "Comprenez les inconnues" | "Descentralização máxima" | "Ajustes limitados; custódia e saída fixas" | "Oráculos, alocação ou pausas externas" | "Mudanças por governança com atraso" | "Conselho independente; poderes de emergência" | "Autoridade do conselho e da fundação" | "Conselho nomeado e operador" | "Administrador pode substituir as regras" | "Operador controla validação ou saídas" | "Emissor controla lastro ou resgate" | "Entenda as incógnitas" | "Maximale Dezentralisierung" | "Begrenzte Einstellungen; Verwahrung und Ausstieg fest" | "Externe Orakel, Zuteilung oder Pausen" | "Regeländerungen durch verzögerte Governance" | "Unabhängiger Rat; Notfallbefugnisse" | "Rat und Stiftung teilen Befugnisse" | "Ernannter Rat und Betreiber" | "Administrator kann Kernregeln ersetzen" | "Betreiber kontrolliert Validierung oder Ausstieg" | "Emittent kontrolliert Deckung oder Rücknahme" | "Fragezeichen verstehen";
    definition: "Ethereum L1 is the baseline. For an app or token, no extra administrator can change the reviewed rules for holding or withdrawing your assets." | "An administrator can change limited settings, such as fees. They cannot replace the reviewed rules for holding or withdrawing your assets." | "An outside party can supply prices, decide how assets are allocated, or pause activity. They cannot freely replace the core rules." | "Governance can change the rules after a required waiting period. A review checks whether you can exit or veto a change before it takes effect." | "An elected, accountable and diverse council can make emergency changes immediately. Ordinary governance changes must wait." | "A governed council and a foundation share immediate control. The foundation also has its own powers or a backup route to act." | "An operator and an appointed council share immediate control. Users have limited power to elect or remove them." | "An administrator or small committee can replace the core rules. A protective waiting period and independent veto have not been verified." | "An operator can also restrict who checks or challenges transactions, or prevent the usual transaction and withdrawal routes from working." | "An issuer or custodian controls the assets backing a token, redemption, or seizure. Using Ethereum does not remove that control." | "D? means a review is missing or incomplete. ≥ D5 means at least D5: a part that has not been reviewed may add more control. Neither label means safe or unsafe." | "Open ground for everyone. Even the tallest institutions stand stronger on a shared foundation." | "在评估范围内，没有比以太坊 L1 额外的特权主体控制本金或退出。" | "管理员只能调整有边界的参数，没有已知任意转移本金的权限。" | "依赖预言机、分配者或暂停等外部运营权限。" | "治理可更改系统，但普通变更有公开记录的强制延迟。" | "选举产生且可问责的委员会可紧急升级；普通变更有延迟。" | "正式委员会与基金会共同保有即时升级权限，存在基金会后备权力。" | "指定的委员会与运营方共同控制即时升级，公开罢免机制有限。" | "集中式管理员可升级系统，未核实有效延迟或独立否决机制。" | "运营方还控制验证者或挑战者准入，可能限制强制纳入交易。" | "发行方或托管方可控制链外储备、赎回或冻结资产。" | "D? 表示评估未完成。≥D5 表示至少为 D5，未确定的依赖可能增加控制权。两者都不是安全结论。" | "人人共享的开放地基。再高的机构，也因共同的基础而更加稳固。" | "Sin control privilegiado adicional del principal o de la salida respecto a Ethereum L1, en el ámbito revisado." | "Permite ajustar parámetros acotados, sin un poder conocido para mover arbitrariamente el principal." | "Depende de poderes operativos externos: oráculos, asignadores o pausas." | "La gobernanza puede modificar el sistema, con una demora obligatoria documentada para cambios ordinarios." | "Un consejo elegido y responsable puede actuar de emergencia; los cambios ordinarios tienen demora." | "Un consejo formal y una fundación comparten actualizaciones inmediatas, con facultades de respaldo de la fundación." | "Un consejo designado y un operador controlan actualizaciones inmediatas, con destitución pública limitada." | "Un administrador concentrado puede actualizar el sistema sin demora eficaz o veto independiente verificados." | "El operador controla quién valida o impugna, y puede limitar la inclusión forzada." | "Un emisor o custodio controla reservas externas, reembolsos o congelación de activos." | "D? indica una evaluación incompleta. ≥D5 significa al menos D5: otra dependencia puede añadir autoridad. No es un juicio de seguridad." | "Terreno abierto para todos. Incluso las instituciones más altas se sostienen mejor sobre cimientos compartidos." | "評価範囲で、Ethereum L1以外に元本や退出を管理する特権主体はありません。" | "管理者は限定された設定を変更できますが、任意に元本を動かす権限は確認されていません。" | "オラクル、資産配分、停止など外部の運用権限に依存します。" | "システム変更が可能ですが、通常の変更には文書化された強制待機期間があります。" | "選挙と説明責任のある評議会が緊急更新でき、通常の変更には遅延があります。" | "正式な評議会と財団が即時更新を共同管理し、財団へのフォールバックがあります。" | "任命された評議会と運営者が即時更新を共同管理し、公的な解任権は限定的です。" | "集中した管理者が更新でき、有効な遅延や独立した拒否権は未確認です。" | "運営者は検証者・異議申立者の参加も制限し、強制包含を制限する場合があります。" | "発行者や保管者がオフチェーンの準備資産、償還、凍結を管理できます。" | "D? は評価未完了。≥D5 は少なくとも D5 で、未確認の依存先が権限を加える可能性があります。安全性の判定ではありません。" | "誰にでも開かれた大地。大きな組織も、共有の土台でいっそう強く立てます。" | "평가 범위에서 이더리움 L1 외에 원금이나 출금을 통제하는 특권 주체가 없습니다." | "관리자는 제한된 설정만 변경하며 원금을 임의로 옮기는 권한은 확인되지 않았습니다." | "오라클, 배분자 또는 일시 중지 같은 외부 운영 권한에 의존합니다." | "시스템 변경이 가능하나 일반 변경에는 문서화된 강제 지연이 있습니다." | "선출되고 책임을 지는 위원회가 긴급 업그레이드를 수행하며 일반 변경에는 지연이 있습니다." | "공식 위원회와 재단이 즉시 업그레이드를 공동 통제하며 재단 대체 권한이 있습니다." | "임명된 위원회와 운영자가 즉시 업그레이드를 통제하며 공개 해임 수단은 제한됩니다." | "집중된 관리자가 업그레이드하며 유효한 지연이나 독립적 거부권은 미확인입니다." | "운영자는 검증자나 이의 제기자 참여를 제한하고 강제 거래 포함도 제한할 수 있습니다." | "발행자나 수탁자가 오프체인 준비금, 상환 또는 자산 동결을 통제할 수 있습니다." | "D?는 검토 미완료입니다. ≥D5는 최소 D5이며 미확인 의존 관계가 권한을 더할 수 있습니다. 안전성 판정은 아닙니다." | "모두에게 열린 땅. 아무리 큰 기관도 함께 쓰는 기반 위에서 더 단단히 섭니다." | "Aucun contrôle privilégié supplémentaire du capital ou de la sortie par rapport à Ethereum L1, dans le périmètre examiné." | "Réglages bornés, sans pouvoir connu de déplacer arbitrairement le capital." | "Dépend de pouvoirs opérationnels externes : oracles, allocateurs ou pauses." | "La gouvernance peut modifier le système, avec un délai obligatoire documenté pour les changements ordinaires." | "Un conseil élu et responsable peut agir en urgence ; les changements ordinaires sont retardés." | "Un conseil formel et une fondation partagent les mises à niveau immédiates, avec des pouvoirs de repli de la fondation." | "Un conseil nommé et un opérateur contrôlent les mises à niveau immédiates ; la révocation publique est limitée." | "Un administrateur concentré peut modifier le système, sans délai efficace ni veto indépendant vérifiés." | "L’opérateur contrôle l’admission des validateurs ou contestataires et peut limiter l’inclusion forcée." | "L’émetteur ou le dépositaire contrôle les réserves hors chaîne, le rachat ou le gel des actifs." | "D? signifie que l’examen est incomplet. ≥D5 veut dire au moins D5 : une dépendance non résolue peut ajouter des pouvoirs. Ce n’est pas un verdict de sécurité." | "Un terrain ouvert à tous. Même les plus grandes institutions tiennent mieux sur des fondations communes." | "Sem controle privilegiado adicional do principal ou da saída em relação ao Ethereum L1, no escopo revisado." | "Ajustes limitados, sem poder conhecido para movimentar arbitrariamente o principal." | "Depende de poderes operacionais externos: oráculos, alocadores ou pausas." | "A governança pode alterar o sistema, com atraso obrigatório documentado para mudanças comuns." | "Um conselho eleito e responsável pode agir em emergência; mudanças comuns têm atraso." | "Conselho formal e fundação compartilham atualizações imediatas, com poderes de contingência da fundação." | "Conselho indicado e operador controlam atualizações imediatas; a remoção pública é limitada." | "Administrador concentrado pode atualizar o sistema sem atraso eficaz ou veto independente verificados." | "O operador controla quem valida ou contesta e pode limitar a inclusão forçada." | "Emissor ou custodiante controla reservas externas, resgate ou congelamento de ativos." | "D? indica análise incompleta. ≥D5 significa pelo menos D5: uma dependência pendente pode acrescentar autoridade. Não é um veredito de segurança." | "Terreno aberto para todos. Até as maiores instituições ficam mais firmes sobre uma base compartilhada." | "Keine zusätzliche privilegierte Kontrolle über Kapital oder Ausstieg gegenüber Ethereum L1 im geprüften Umfang." | "Begrenzte Einstellungen, ohne bekannte Befugnis zur beliebigen Bewegung des Kapitals." | "Abhängig von externen Betriebsrechten: Orakel, Allokation oder Pausen." | "Governance kann das System ändern; normale Änderungen haben eine dokumentierte, erzwungene Verzögerung." | "Ein gewählter, rechenschaftspflichtiger Rat kann im Notfall handeln; normale Änderungen sind verzögert." | "Formeller Rat und Stiftung teilen sofortige Upgrades, mit Rückfallbefugnissen der Stiftung." | "Ernannter Rat und Betreiber kontrollieren sofortige Upgrades; öffentliche Abberufung ist begrenzt." | "Konzentrierte Administration kann Upgrades durchführen; wirksame Verzögerung oder unabhängiges Veto sind ungeprüft." | "Der Betreiber kontrolliert den Zugang zur Validierung oder Anfechtung und kann erzwungene Aufnahme begrenzen." | "Emittent oder Verwahrer kontrolliert externe Reserven, Rücknahme oder Einfrieren von Werten." | "D? bedeutet unvollständige Prüfung. ≥D5 bedeutet mindestens D5: ungeprüfte Abhängigkeiten können weitere Macht hinzufügen. Beides ist kein Sicherheitsurteil." | "Offener Grund für alle. Auch die größten Institutionen stehen stärker auf einem gemeinsamen Fundament.";
    uncertainty: "D? means a review is missing or incomplete. ≥ D5 means at least D5: a part that has not been reviewed may add more control. Neither label means safe or unsafe." | "D? 表示评估未完成。≥D5 表示至少为 D5，未确定的依赖可能增加控制权。两者都不是安全结论。" | "D? indica una evaluación incompleta. ≥D5 significa al menos D5: otra dependencia puede añadir autoridad. No es un juicio de seguridad." | "D? は評価未完了。≥D5 は少なくとも D5 で、未確認の依存先が権限を加える可能性があります。安全性の判定ではありません。" | "D?는 검토 미완료입니다. ≥D5는 최소 D5이며 미확인 의존 관계가 권한을 더할 수 있습니다. 안전성 판정은 아닙니다." | "D? signifie que l’examen est incomplet. ≥D5 veut dire au moins D5 : une dépendance non résolue peut ajouter des pouvoirs. Ce n’est pas un verdict de sécurité." | "D? indica análise incompleta. ≥D5 significa pelo menos D5: uma dependência pendente pode acrescentar autoridade. Não é um veredito de segurança." | "D? bedeutet unvollständige Prüfung. ≥D5 bedeutet mindestens D5: ungeprüfte Abhängigkeiten können weitere Macht hinzufügen. Beides ist kein Sicherheitsurteil." | null;
};
/**
 * Pure, bounded graph evaluation. IDs denote actual control dependencies, never
 * ticker or brand similarity. Cycles and oversized graphs are rejected explicitly.
 */
export declare function assessControlGraph(rootId: string, reviews: readonly ControlReview[]): Assessment;
export declare function safeEvidenceUrl(value: string): string | null;
//# sourceMappingURL=index.d.ts.map