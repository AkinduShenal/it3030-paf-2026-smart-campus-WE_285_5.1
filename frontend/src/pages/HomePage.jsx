import { Link } from "react-router-dom";
import {
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
		icon: FaMapMarkedAlt
	},
	{
		label: "Pending Bookings",
		value: "14",
		icon: FaCalendarAlt
	},
	{
		label: "Open Tickets",
		value: "9",
		icon: FaTools
	}
];

const quickActions = [
	{
		title: "Manage Catalogue",
		description: "Rooms, labs, and assets.",
		to: "/catalogue",
		icon: FaMapMarkedAlt
	},
	{
		title: "Review Bookings",
		description: "Approve pending requests.",
		to: "/bookings",
		icon: FaCalendarCheck
	},
	{
		title: "Track Incidents",
		description: "Monitor and resolve tickets.",
		to: "/tickets",
		icon: FaClipboardCheck
	}
];

const timelineItems = [
"08:30 AM: New lab request submitted",
"10:10 AM: Ticket #204 moved to IN_PROGRESS",
"11:45 AM: Camera asset marked ACTIVE"
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
			<header className={styles.hero} style={{ backgroundImage: "url('" + dashboardImage + "')" }}>
				<div className={styles.heroOverlay} />
				<div className={styles.heroAtmosphere} aria-hidden="true" />
				<div className={styles.heroContent}>
					<h2>Operations Dashboard</h2>
					<p className={styles.heroSubtitle}>A simple view of campus activity.</p>
					<span className={styles.heroChip}>{formattedDate}</span>
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
						</article>
					);
				})}
			</div>

			<section className={styles.panel}>
				<div className={styles.panelHead}>
					<h3>Quick Actions</h3>
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
									<FaChevronRight className={styles.actionArrow} />
								</Link>
							</li>
						);
					})}
				</ul>
			</section>

			<section className={styles.panel}>
				<div className={styles.panelHead}>
					<h3>Today Timeline</h3>
				</div>
				<ul className={styles.timelineList}>
					{timelineItems.map((item) => (
						<li key={item} className={styles.timelineRow}>
							<FaRegClock className={styles.timelineIcon} />
							<span>{item}</span>
						</li>
					))}
				</ul>
			</section>
		</section>
	);
}

export default HomePage;
