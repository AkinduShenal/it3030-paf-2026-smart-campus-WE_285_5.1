import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
	createResource,
	deleteResource,
	fetchResources,
	updateResource
} from "../features/catalogue/resourceApi";

const smoothEase = [0.22, 1, 0.36, 1];

const containerVariants = {
	hidden: { opacity: 0, y: 14 },
	visible: {
		opacity: 1,
		y: 0,
		transition: {
			duration: 0.58,
			ease: smoothEase,
			staggerChildren: 0.08
		}
	}
};

const sectionVariants = {
	hidden: { opacity: 0, y: 10 },
	visible: {
		opacity: 1,
		y: 0,
		transition: {
			duration: 0.52,
			ease: smoothEase
		}
	}
};

const resourceTypes = ["LECTURE_HALL", "LAB", "MEETING_ROOM", "PROJECTOR", "CAMERA", "OTHER"];
const resourceStatuses = ["ACTIVE", "OUT_OF_SERVICE"];

const initialFormState = {
	name: "",
	type: "LECTURE_HALL",
	capacity: "",
	location: "",
	status: "ACTIVE",
	availabilityDays: "Weekdays",
	availabilityStart: "08:00",
	availabilityEnd: "17:00"
};

const initialFilterState = {
	type: "",
	status: "",
	location: "",
	minCapacity: "",
	maxCapacity: ""
};

function toTimeInputValue(value) {
	if (!value) {
		return "";
	}
	return value.slice(0, 5);
}

function formatEnumLabel(value) {
	if (!value) {
		return "-";
	}
	return value
		.toLowerCase()
		.split("_")
		.map((token) => token.charAt(0).toUpperCase() + token.slice(1))
		.join(" ");
}

function getErrorMessage(error) {
	const apiError = error?.response?.data;
	if (apiError?.validationErrors) {
		const firstValidation = Object.values(apiError.validationErrors)[0];
		if (firstValidation) {
			return firstValidation;
		}
	}
	return apiError?.message || error.message || "Request failed";
}

function CataloguePage() {
	const { hasRole } = useAuth();
	const isAdmin = hasRole("ADMIN");
	const [resources, setResources] = useState([]);
	const [form, setForm] = useState(initialFormState);
	const [filters, setFilters] = useState(initialFilterState);
	const [isLoading, setIsLoading] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [editingId, setEditingId] = useState(null);
	const [feedback, setFeedback] = useState({ type: "", text: "" });

	const formTitle = useMemo(() => (editingId ? "Update Resource" : "Add New Resource"), [editingId]);
	const activeCount = useMemo(() => resources.filter((resource) => resource.status === "ACTIVE").length, [resources]);
	const outOfServiceCount = useMemo(
		() => resources.filter((resource) => resource.status === "OUT_OF_SERVICE").length,
		[resources]
	);
	const totalCapacity = useMemo(
		() => resources.reduce((sum, resource) => sum + Number(resource.capacity || 0), 0),
		[resources]
	);

	async function loadResources(activeFilters = filters) {
		try {
			setIsLoading(true);
			const data = await fetchResources(activeFilters);
			setResources(data);
		} catch (error) {
			setFeedback({ type: "error", text: getErrorMessage(error) });
		} finally {
			setIsLoading(false);
		}
	}

	useEffect(() => {
		loadResources();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	function handleFormChange(event) {
		const { name, value } = event.target;
		setForm((prev) => ({ ...prev, [name]: value }));
	}

	function handleFilterChange(event) {
		const { name, value } = event.target;
		setFilters((prev) => ({ ...prev, [name]: value }));
	}

	function resetForm() {
		setEditingId(null);
		setForm(initialFormState);
	}

	async function handleSave(event) {
		if (!isAdmin) {
			setFeedback({ type: "error", text: "Only ADMIN users can modify resources." });
			return;
		}
		event.preventDefault();
		setFeedback({ type: "", text: "" });

		const payload = {
			name: form.name,
			type: form.type,
			capacity: Number(form.capacity),
			location: form.location,
			status: form.status,
			availabilityDays: form.availabilityDays,
			availabilityStart: form.availabilityStart || null,
			availabilityEnd: form.availabilityEnd || null
		};

		try {
			setIsSubmitting(true);
			if (editingId) {
				await updateResource(editingId, payload);
				setFeedback({ type: "success", text: "Resource updated successfully." });
			} else {
				await createResource(payload);
				setFeedback({ type: "success", text: "Resource created successfully." });
			}
			resetForm();
			await loadResources();
		} catch (error) {
			setFeedback({ type: "error", text: getErrorMessage(error) });
		} finally {
			setIsSubmitting(false);
		}
	}

	function handleEdit(resource) {
		if (!isAdmin) {
			return;
		}
		setEditingId(resource.id);
		setForm({
			name: resource.name,
			type: resource.type,
			capacity: String(resource.capacity ?? ""),
			location: resource.location,
			status: resource.status,
			availabilityDays: resource.availabilityDays || "",
			availabilityStart: toTimeInputValue(resource.availabilityStart),
			availabilityEnd: toTimeInputValue(resource.availabilityEnd)
		});
		setFeedback({ type: "", text: "" });
	}

	async function handleDelete(resource) {
		if (!isAdmin) {
			return;
		}
		const confirmed = window.confirm(`Delete resource \"${resource.name}\"?`);
		if (!confirmed) {
			return;
		}

		try {
			await deleteResource(resource.id);
			setFeedback({ type: "success", text: "Resource deleted successfully." });
			await loadResources();
		} catch (error) {
			setFeedback({ type: "error", text: getErrorMessage(error) });
		}
	}

	async function handleFilterSubmit(event) {
		event.preventDefault();
		await loadResources(filters);
	}

	async function handleFilterReset() {
		setFilters(initialFilterState);
		await loadResources(initialFilterState);
	}

	return (
		<motion.section className="catalogue-page" variants={containerVariants} initial="hidden" animate="visible">
			<motion.header className="catalogue-hero" variants={sectionVariants}>
				<div className="catalogue-hero-main">
					<p className="catalogue-eyebrow">Campus Operations Console</p>
					<h2>Facilities and Assets Catalogue</h2>
					<p>View campus resources with availability, location, and status filtering.</p>
					{!isAdmin && (
						<p className="catalogue-readonly">Read-only mode: only ADMIN can create, update, and delete resources.</p>
					)}
				</div>
				<div className="catalogue-metrics">
					<article className="catalogue-metric-card">
						<span>Total Assets</span>
						<strong>{resources.length}</strong>
					</article>
					<article className="catalogue-metric-card">
						<span>Active</span>
						<strong>{activeCount}</strong>
					</article>
					<article className="catalogue-metric-card">
						<span>Out of Service</span>
						<strong>{outOfServiceCount}</strong>
					</article>
					<article className="catalogue-metric-card">
						<span>Total Capacity</span>
						<strong>{totalCapacity}</strong>
					</article>
				</div>
			</motion.header>

			<div className="catalogue-grid">
				{isAdmin && (
					<motion.article className="panel-card catalogue-panel" variants={sectionVariants}>
						<div className="catalogue-panel-head">
							<h3>{formTitle}</h3>
							<p>Create or update campus resources with complete availability details.</p>
						</div>
						<form className="form-grid catalogue-form-grid" onSubmit={handleSave}>
						<label className="field-span-2">
							<span>Name</span>
							<input name="name" value={form.name} onChange={handleFormChange} required maxLength={120} />
						</label>

						<label>
							<span>Type</span>
							<select name="type" value={form.type} onChange={handleFormChange}>
								{resourceTypes.map((type) => (
									<option key={type} value={type}>
										{type}
									</option>
								))}
							</select>
						</label>

						<label>
							<span>Capacity</span>
							<input
								name="capacity"
								value={form.capacity}
								onChange={handleFormChange}
								type="number"
								min="1"
								required
							/>
						</label>

						<label className="field-span-2">
							<span>Location</span>
							<input name="location" value={form.location} onChange={handleFormChange} required maxLength={150} />
						</label>

						<label>
							<span>Status</span>
							<select name="status" value={form.status} onChange={handleFormChange}>
								{resourceStatuses.map((status) => (
									<option key={status} value={status}>
										{status}
									</option>
								))}
							</select>
						</label>

						<label>
							<span>Availability Days</span>
							<input
								name="availabilityDays"
								value={form.availabilityDays}
								onChange={handleFormChange}
								maxLength={100}
							/>
						</label>

						<div className="time-row field-span-2">
							<label>
								<span>Available From</span>
								<input
									name="availabilityStart"
									value={form.availabilityStart}
									onChange={handleFormChange}
									type="time"
								/>
							</label>
							<label>
								<span>Available To</span>
								<input
									name="availabilityEnd"
									value={form.availabilityEnd}
									onChange={handleFormChange}
									type="time"
								/>
							</label>
						</div>

							<div className="form-actions field-span-2">
								<button type="submit" disabled={isSubmitting}>
									{isSubmitting ? "Saving..." : editingId ? "Update Resource" : "Create Resource"}
								</button>
								{editingId && (
									<button type="button" className="ghost-btn" onClick={resetForm}>
										Cancel Edit
									</button>
								)}
							</div>
						</form>
					</motion.article>
				)}

				<motion.article className="panel-card catalogue-panel" variants={sectionVariants}>
					<div className="catalogue-panel-head">
						<h3>Search and Filters</h3>
						<p>Narrow results by type, status, location, and capacity range.</p>
					</div>
					<form className="filter-grid catalogue-filter-grid" onSubmit={handleFilterSubmit}>
						<label>
							<span>Type</span>
							<select name="type" value={filters.type} onChange={handleFilterChange}>
								<option value="">All</option>
								{resourceTypes.map((type) => (
									<option key={type} value={type}>
										{type}
									</option>
								))}
							</select>
						</label>

						<label>
							<span>Status</span>
							<select name="status" value={filters.status} onChange={handleFilterChange}>
								<option value="">All</option>
								{resourceStatuses.map((status) => (
									<option key={status} value={status}>
										{status}
									</option>
								))}
							</select>
						</label>

						<label className="field-span-2">
							<span>Location</span>
							<input name="location" value={filters.location} onChange={handleFilterChange} />
						</label>

						<label>
							<span>Min Capacity</span>
							<input
								name="minCapacity"
								value={filters.minCapacity}
								onChange={handleFilterChange}
								type="number"
								min="1"
							/>
						</label>

						<label>
							<span>Max Capacity</span>
							<input
								name="maxCapacity"
								value={filters.maxCapacity}
								onChange={handleFilterChange}
								type="number"
								min="1"
							/>
						</label>

						<div className="form-actions field-span-2">
							<button type="submit">Apply Filters</button>
							<button type="button" className="ghost-btn" onClick={handleFilterReset}>
								Reset
							</button>
						</div>
					</form>
				</motion.article>
			</div>

			{feedback.text && (
				<motion.p
					variants={sectionVariants}
					className={feedback.type === "error" ? "feedback error" : "feedback success"}
				>
					{feedback.text}
				</motion.p>
			)}

			<motion.article className="panel-card catalogue-panel" variants={sectionVariants}>
				<div className="table-header">
					<h3>Resource List</h3>
					<span>{resources.length} item(s)</span>
				</div>
				{isLoading ? (
					<p className="catalogue-empty-state">Loading resources...</p>
				) : resources.length === 0 ? (
					<p className="catalogue-empty-state">No resources found for current filters.</p>
				) : (
					<div className="table-wrap">
						<table>
							<thead>
								<tr>
									<th>Name</th>
									<th>Type</th>
									<th>Capacity</th>
									<th>Location</th>
									<th>Status</th>
									<th>Availability</th>
									<th>Actions</th>
								</tr>
							</thead>
							<tbody>
								{resources.map((resource, index) => (
									<tr key={resource.id} className="catalogue-row" style={{ animationDelay: `${index * 45}ms` }}>
										<td>{resource.name}</td>
										<td>{formatEnumLabel(resource.type)}</td>
										<td>{resource.capacity}</td>
										<td>{resource.location}</td>
										<td>
											<span
												className={resource.status === "ACTIVE" ? "status-chip active" : "status-chip inactive"}
											>
												{formatEnumLabel(resource.status)}
											</span>
										</td>
										<td>
											{resource.availabilityDays || "-"}
											<br />
											<small>
												{toTimeInputValue(resource.availabilityStart) || "--:--"} -{" "}
												{toTimeInputValue(resource.availabilityEnd) || "--:--"}
											</small>
										</td>
										<td className="actions-cell">
											{isAdmin ? (
												<>
													<button type="button" className="small-btn" onClick={() => handleEdit(resource)}>
														Edit
													</button>
													<button
														type="button"
														className="small-btn danger"
														onClick={() => handleDelete(resource)}
													>
														Delete
													</button>
												</>
											) : (
												<span>-</span>
											)}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</motion.article>
		</motion.section>
	);
}

export default CataloguePage;
