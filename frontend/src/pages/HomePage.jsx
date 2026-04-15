import { Link } from "react-router-dom";
import {
	FaBell,
	FaCalendarAlt,
	FaCalendarCheck,
	FaChevronRight,
	FaClipboardCheck,
	FaMapMarkedAlt,
	FaRegClock,
	FaTools
} from "react-icons/fa";
import styles from "../styles/dashboard.module.css";

const dashboardImage = new URL("../assets/cover.jpg", import.meta.url).href;

const metrics = [
	{
		label: "Active Resources",
		value: "128",
		note: "+11 today",
		icon: FaMapMarkedAlt,
		tone: "good"
	},
	{
		label: "Pending Bookings",
		value: "14",
		note: "4 need review",
		icon: FaCalendarAlt,
		tone: "warn"
	},
	{
		label: "Open Tickets",
		value: "9",
		note: "3 high priority",
		icon: FaTools,
		tone: "good"
	}
];

const quickActions = [
	{
		title: "Manage Catalogue",
		description: "Add and update rooms, labs, and equipment.",
		to: "/catalogue",
		cta: "Open Catalogue",
		icon: FaMapMarkedAlt
	},
	{
		title: "Review Bookings",
		description: "Approve or reject booking requests quickly.",
		to: "/bookings",
		cta: "Open Bookings",
		icon: FaCalendarCheck
	},
	{
		title: "Track Incidents",
		description: "Monitor incidents and close maintenance tasks.",
		to: "/tickets",
		cta: "Open Tickets",
		icon: FaClipboardCheck
	}
];

const signalItems = [
	{ title: "Notification Queue", status: "Stable" },
	{ title: "Ticket SLA Watch", status: "Attention" },
	{ title: "Booking Collision Guard", status: "Healthy" }
];

const timelineItems = [
	"08:30 AM: New lab slot request submitted for Building C",
	"10:10 AM: Ticket #204 moved to IN_PROGRESS",
	"11:45 AM: Camera asset marked ACTIVE after maintenance"
];

function HomePage() {
	const now = new Date();
	const formattedDate = now.toLocaleDateString(undefined, {
		weekday: "long",
		month: "short",
		day: "numeric"
	});

	return (
		<section className={styles.root}>
			<header className={styles.hero} style={{ backgroundImage: `url('${dashboardImage}')` }}>
				<div className={styles.heroOverlay} />
				<div className={styles.heroContent}>
					<p className={styles.kicker}>Smart Campus Operations</p>
					<h2>Operations Dashboard</h2>
					<p>Everything you need in one clean view.</p>
					<div className={styles.heroMeta}>
						<span>{formattedDate}</span>
						<span>Live Overview</span>
					</div>
				</div>
			</header>

			<div className={styles.metricsGrid} role="list" aria-label="Operational summary cards">
				{metrics.map((card) => {
					const Icon = card.icon;
					return (
						<article key={card.label} className={styles.metricCard} role="listitem">
							<div className={styles.metricTop}>
								<p>{card.label}</p>
								<span className={styles.iconWrap}>
									<Icon />
								</span>
							</div>
							<p className={styles.metricValue}>{card.value}</p>
							<p className={`${styles.metricNote} ${card.tone === "warn" ? styles.warn : styles.good}`}>
								{card.note}
							</p>
						</article>
					);
				})}
			</div>

			<div className={styles.mainGrid}>
				<section className={styles.panelWide}>
					<div className={styles.panelHead}>
						<h3>Quick Actions</h3>
						<p>Pick a module and continue your workflow.</p>
					</div>
					<ul className={styles.actionList}>
						{quickActions.map((item) => {
							const Icon = item.icon;
							return (
								<li key={item.title}>
									<Link to={item.to} className={styles.actionRow}>
										<span className={styles.actionIcon}>
											<Icon />
										</span>
										<span className={styles.actionContent}>
											<strong>{item.title}</strong>
											<small>{item.description}</small>
										</span>
										<span className={styles.actionCta}>
											{item.cta}
											<FaChevronRight />
										</span>
									</Link>
								</li>
							);
						})}
					</ul>
				</section>

				<section className={styles.panel}>
					<div className={styles.panelHead}>
						<h3>System Signals</h3>
						<p>Quick health check for key flows.</p>
					</div>
					<ul className={styles.signalList}>
						{signalItems.map((item) => (
							<li key={item.title} className={styles.signalItem}>
								<p className={styles.signalTitle}>{item.title}</p>
								<span className={`${styles.signalBadge} ${styles[item.status.toLowerCase()]}`}>{item.status}</span>
							</li>
						))}
					</ul>
				</section>
			</div>

			<div className={styles.bottomGrid}>
				<section className={styles.panel}>
					<div className={styles.panelHead}>
						<h3>Today Timeline</h3>
						<p>Recent events and activity snapshots.</p>
					</div>
					<ul className={styles.timelineList}>
						{timelineItems.map((item) => (
							<li key={item}>
								<FaRegClock className={styles.timelineIcon} />
								<span>{item}</span>
							</li>
						))}
					</ul>
				</section>

				<section className={styles.spotlight}>
					<img src={dashboardImage} alt="Campus operations" />
					<div className={styles.spotlightOverlay} />
					<div className={styles.spotlightContent}>
						<h3>Campus Insight</h3>
						<p>Clean operations start with clear visibility and faster decisions.</p>
						<div className={styles.spotlightHint}>
							<FaBell />
							<span>Notifications active and synchronized</span>
						</div>
					</div>
				</section>
			</div>
		</section>
	);
}

export default HomePage;
