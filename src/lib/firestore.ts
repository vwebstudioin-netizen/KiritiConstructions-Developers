import {
  doc, getDoc, getDocs, collection, query, orderBy, where,
  setDoc, addDoc, updateDoc, deleteDoc, serverTimestamp, collectionGroup, increment,
} from 'firebase/firestore'
import { db } from './firebase'
import type {
  CompanyInfo, Client, Service, Project, Milestone, ProjectDocument,
  Payment, TeamMember, BlogPost, Enquiry, Testimonial,
  Supervisor, SiteTeamMember, ProjectMaterial, MaterialTransaction, DailyReport,
  Quote, ProjectExpense, ProjectVendor, VendorOrder,
  InventoryProject, InventoryUnit, UnitEnquiry,
} from '@/types'

// ─── Company ──────────────────────────────────────────────────────
export async function getCompanyInfo(): Promise<CompanyInfo | null> {
  try { const s = await getDoc(doc(db, 'company', 'info')); return s.exists() ? s.data() as CompanyInfo : null } catch { return null }
}
export async function saveCompanyInfo(data: Partial<CompanyInfo>) {
  await setDoc(doc(db, 'company', 'info'), { ...data, updatedAt: serverTimestamp() }, { merge: true })
}

// ─── Clients ──────────────────────────────────────────────────────
export async function getClientByUid(uid: string): Promise<Client | null> {
  try {
    const q = query(collection(db, 'clients'), where('uid', '==', uid))
    const snap = await getDocs(q)
    if (snap.empty) return null
    const d = snap.docs[0]; return { id: d.id, ...d.data() } as Client
  } catch { return null }
}
export async function getAllClients(): Promise<Client[]> {
  try { const s = await getDocs(collection(db, 'clients')); return s.docs.map((d) => ({ id: d.id, ...d.data() } as Client)) } catch { return [] }
}
export async function addClient(data: Omit<Client, 'id'>) {
  return (await addDoc(collection(db, 'clients'), { ...data, createdAt: serverTimestamp() })).id
}
export async function updateClient(id: string, data: Partial<Client>) { await updateDoc(doc(db, 'clients', id), data) }
export async function deleteClient(id: string) { await deleteDoc(doc(db, 'clients', id)) }

// ─── Services ─────────────────────────────────────────────────────
export async function getAvailableServices(): Promise<Service[]> {
  try { const q = query(collection(db, 'services'), where('isAvailable', '==', true)); const s = await getDocs(q); return s.docs.map((d) => ({ id: d.id, ...d.data() } as Service)).sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)) } catch { return [] }
}
export async function getAllServices(): Promise<Service[]> {
  try { const q = query(collection(db, 'services'), orderBy('sortOrder')); const s = await getDocs(q); return s.docs.map((d) => ({ id: d.id, ...d.data() } as Service)) } catch { return [] }
}
export async function getServiceBySlug(slug: string): Promise<Service | null> {
  try { const q = query(collection(db, 'services'), where('slug', '==', slug)); const s = await getDocs(q); if (s.empty) return null; const d = s.docs[0]; return { id: d.id, ...d.data() } as Service } catch { return null }
}
export async function addService(data: Omit<Service, 'id'>) { return (await addDoc(collection(db, 'services'), { ...data, createdAt: serverTimestamp() })).id }
export async function updateService(id: string, data: Partial<Service>) { await updateDoc(doc(db, 'services', id), data) }
export async function deleteService(id: string) { await deleteDoc(doc(db, 'services', id)) }

// ─── Projects ─────────────────────────────────────────────────────
export async function getVisibleProjects(): Promise<Project[]> {
  // No orderBy — avoids composite index requirement. Sort client-side.
  try { const q = query(collection(db, 'projects'), where('isVisible', '==', true)); const s = await getDocs(q); return s.docs.map((d) => ({ id: d.id, ...d.data() } as Project)).sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)) } catch { return [] }
}
export async function getAllProjects(): Promise<Project[]> {
  try { const q = query(collection(db, 'projects'), orderBy('sortOrder')); const s = await getDocs(q); return s.docs.map((d) => ({ id: d.id, ...d.data() } as Project)) } catch { return [] }
}
export async function getProjectsByClient(clientId: string): Promise<Project[]> {
  try { const q = query(collection(db, 'projects'), where('clientId', '==', clientId)); const s = await getDocs(q); return s.docs.map((d) => ({ id: d.id, ...d.data() } as Project)) } catch { return [] }
}
export async function getProjectBySlug(slug: string): Promise<Project | null> {
  try { const q = query(collection(db, 'projects'), where('slug', '==', slug)); const s = await getDocs(q); if (s.empty) return null; const d = s.docs[0]; return { id: d.id, ...d.data() } as Project } catch { return null }
}
export async function getProjectById(id: string): Promise<Project | null> {
  try { const s = await getDoc(doc(db, 'projects', id)); return s.exists() ? { id: s.id, ...s.data() } as Project : null } catch { return null }
}
export async function addProject(data: Omit<Project, 'id'>) { return (await addDoc(collection(db, 'projects'), { ...data, createdAt: serverTimestamp() })).id }
export async function updateProject(id: string, data: Partial<Project>) { await updateDoc(doc(db, 'projects', id), data) }
export async function deleteProject(id: string) { await deleteDoc(doc(db, 'projects', id)) }

// ─── Milestones (subcollection) ────────────────────────────────────
export async function getMilestones(projectId: string): Promise<Milestone[]> {
  try { const q = query(collection(db, 'projects', projectId, 'milestones'), orderBy('sortOrder')); const s = await getDocs(q); return s.docs.map((d) => ({ id: d.id, projectId, ...d.data() } as Milestone)) } catch { return [] }
}
export async function addMilestone(projectId: string, data: Omit<Milestone, 'id' | 'projectId'>) {
  return (await addDoc(collection(db, 'projects', projectId, 'milestones'), { ...data, createdAt: serverTimestamp() })).id
}
export async function updateMilestone(projectId: string, milestoneId: string, data: Partial<Milestone>) {
  await updateDoc(doc(db, 'projects', projectId, 'milestones', milestoneId), data)
}
export async function deleteMilestone(projectId: string, milestoneId: string) {
  await deleteDoc(doc(db, 'projects', projectId, 'milestones', milestoneId))
}

// ─── Documents (subcollection) ────────────────────────────────────
export async function getDocuments(projectId: string, clientVisible?: boolean): Promise<ProjectDocument[]> {
  try {
    let q = query(collection(db, 'projects', projectId, 'documents'))
    if (clientVisible !== undefined) q = query(collection(db, 'projects', projectId, 'documents'), where('isClientVisible', '==', clientVisible))
    const s = await getDocs(q); return s.docs.map((d) => ({ id: d.id, projectId, ...d.data() } as ProjectDocument))
  } catch { return [] }
}
export async function addDocument(projectId: string, data: Omit<ProjectDocument, 'id' | 'projectId'>) {
  return (await addDoc(collection(db, 'projects', projectId, 'documents'), { ...data })).id
}
export async function deleteDocument(projectId: string, docId: string) {
  await deleteDoc(doc(db, 'projects', projectId, 'documents', docId))
}
export async function updateDocument(projectId: string, docId: string, data: Partial<ProjectDocument>) {
  await updateDoc(doc(db, 'projects', projectId, 'documents', docId), data)
}

// ─── Payments ─────────────────────────────────────────────────────
export async function getPaymentsByProject(projectId: string): Promise<Payment[]> {
  try { const q = query(collection(db, 'payments'), where('projectId', '==', projectId)); const s = await getDocs(q); return s.docs.map((d) => ({ id: d.id, ...d.data() } as Payment)) } catch { return [] }
}
export async function getPaymentsByClient(clientId: string): Promise<Payment[]> {
  try { const q = query(collection(db, 'payments'), where('clientId', '==', clientId)); const s = await getDocs(q); return s.docs.map((d) => ({ id: d.id, ...d.data() } as Payment)) } catch { return [] }
}
export async function getAllPayments(): Promise<Payment[]> {
  try { const s = await getDocs(collection(db, 'payments')); return s.docs.map((d) => ({ id: d.id, ...d.data() } as Payment)) } catch { return [] }
}
export async function addPayment(data: Omit<Payment, 'id'>) {
  return (await addDoc(collection(db, 'payments'), { ...data })).id
}
export async function updatePayment(id: string, data: Partial<Payment>) { await updateDoc(doc(db, 'payments', id), data) }

// ─── Team ─────────────────────────────────────────────────────────
export async function getVisibleTeam(): Promise<TeamMember[]> {
  try { const q = query(collection(db, 'team'), where('isVisible', '==', true)); const s = await getDocs(q); return s.docs.map((d) => ({ id: d.id, ...d.data() } as TeamMember)).sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)) } catch { return [] }
}
export async function getAllTeam(): Promise<TeamMember[]> {
  try { const q = query(collection(db, 'team'), orderBy('sortOrder')); const s = await getDocs(q); return s.docs.map((d) => ({ id: d.id, ...d.data() } as TeamMember)) } catch { return [] }
}
export async function addTeamMember(data: Omit<TeamMember, 'id'>) { return (await addDoc(collection(db, 'team'), { ...data, createdAt: serverTimestamp() })).id }
export async function updateTeamMember(id: string, data: Partial<TeamMember>) { await updateDoc(doc(db, 'team', id), data) }
export async function deleteTeamMember(id: string) { await deleteDoc(doc(db, 'team', id)) }

// ─── Blog ─────────────────────────────────────────────────────────
export async function getPublishedPosts(): Promise<BlogPost[]> {
  try { const q = query(collection(db, 'blog'), where('isPublished', '==', true)); const s = await getDocs(q); return s.docs.map((d) => ({ id: d.id, ...d.data() } as BlogPost)).sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)) } catch { return [] }
}
export async function getAllPosts(): Promise<BlogPost[]> {
  try { const q = query(collection(db, 'blog'), orderBy('sortOrder')); const s = await getDocs(q); return s.docs.map((d) => ({ id: d.id, ...d.data() } as BlogPost)) } catch { return [] }
}
export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  try { const q = query(collection(db, 'blog'), where('slug', '==', slug)); const s = await getDocs(q); if (s.empty) return null; const d = s.docs[0]; return { id: d.id, ...d.data() } as BlogPost } catch { return null }
}
export async function addPost(data: Omit<BlogPost, 'id'>) { return (await addDoc(collection(db, 'blog'), { ...data, createdAt: serverTimestamp() })).id }
export async function updatePost(id: string, data: Partial<BlogPost>) { await updateDoc(doc(db, 'blog', id), data) }
export async function deletePost(id: string) { await deleteDoc(doc(db, 'blog', id)) }

// ─── Enquiries ────────────────────────────────────────────────────
export async function getAllEnquiries(): Promise<Enquiry[]> {
  try { const s = await getDocs(collection(db, 'enquiries')); return s.docs.map((d) => ({ id: d.id, ...d.data() } as Enquiry)) } catch { return [] }
}
export async function addEnquiry(data: Omit<Enquiry, 'id'>) { return (await addDoc(collection(db, 'enquiries'), { ...data })).id }
export async function updateEnquiry(id: string, data: Partial<Enquiry>) { await updateDoc(doc(db, 'enquiries', id), data) }
export async function deleteEnquiry(id: string) { await deleteDoc(doc(db, 'enquiries', id)) }

// ─── Testimonials ──────────────────────────────────────────────────
export async function getVisibleTestimonials(): Promise<Testimonial[]> {
  try { const q = query(collection(db, 'testimonials'), where('isVisible', '==', true)); const s = await getDocs(q); return s.docs.map((d) => ({ id: d.id, ...d.data() } as Testimonial)) } catch { return [] }
}
export async function getAllTestimonials(): Promise<Testimonial[]> {
  try { const s = await getDocs(collection(db, 'testimonials')); return s.docs.map((d) => ({ id: d.id, ...d.data() } as Testimonial)) } catch { return [] }
}
export async function addTestimonial(data: Omit<Testimonial, 'id'>) { return (await addDoc(collection(db, 'testimonials'), { ...data, createdAt: serverTimestamp() })).id }
export async function updateTestimonial(id: string, data: Partial<Testimonial>) { await updateDoc(doc(db, 'testimonials', id), data) }
export async function deleteTestimonial(id: string) { await deleteDoc(doc(db, 'testimonials', id)) }

// ─── Quotes ───────────────────────────────────────────────────────
export async function getAllQuotes(): Promise<Quote[]> {
  try { const q = query(collection(db, 'quotes'), orderBy('createdAt', 'desc')); const s = await getDocs(q); return s.docs.map((d) => ({ id: d.id, ...d.data() } as Quote)) } catch { return [] }
}
export async function getQuoteById(id: string): Promise<Quote | null> {
  try { const d = await getDoc(doc(db, 'quotes', id)); return d.exists() ? { id: d.id, ...d.data() } as Quote : null } catch { return null }
}
export async function addQuote(data: Omit<Quote, 'id'>) { return (await addDoc(collection(db, 'quotes'), { ...data, createdAt: new Date().toISOString() })).id }
export async function updateQuote(id: string, data: Partial<Quote>) { await updateDoc(doc(db, 'quotes', id), data) }
export async function deleteQuote(id: string) { await deleteDoc(doc(db, 'quotes', id)) }

// ─── Supervisors ──────────────────────────────────────────────────
export async function getAllSupervisors(): Promise<Supervisor[]> {
  try { const s = await getDocs(collection(db, 'supervisors')); return s.docs.map((d) => ({ id: d.id, ...d.data() } as Supervisor)) } catch { return [] }
}
export async function getSupervisorByUid(uid: string): Promise<Supervisor | null> {
  try { const q = query(collection(db, 'supervisors'), where('uid', '==', uid)); const s = await getDocs(q); if (s.empty) return null; const d = s.docs[0]; return { id: d.id, ...d.data() } as Supervisor } catch { return null }
}
export async function addSupervisor(data: Omit<Supervisor, 'id'>) { return (await addDoc(collection(db, 'supervisors'), { ...data, createdAt: new Date().toISOString() })).id }
export async function updateSupervisor(id: string, data: Partial<Supervisor>) { await updateDoc(doc(db, 'supervisors', id), data) }
export async function deleteSupervisor(id: string) { await deleteDoc(doc(db, 'supervisors', id)) }

// ─── Site Team (per project) ──────────────────────────────────────
export async function getSiteTeam(projectId: string): Promise<SiteTeamMember[]> {
  try { const q = query(collection(db, 'projects', projectId, 'team'), orderBy('role')); const s = await getDocs(q); return s.docs.map((d) => ({ id: d.id, projectId, ...d.data() } as SiteTeamMember)) } catch { return [] }
}
export async function addSiteTeamMember(projectId: string, data: Omit<SiteTeamMember, 'id' | 'projectId'>) {
  return (await addDoc(collection(db, 'projects', projectId, 'team'), { ...data, createdAt: new Date().toISOString() })).id
}
export async function deleteSiteTeamMember(projectId: string, memberId: string) { await deleteDoc(doc(db, 'projects', projectId, 'team', memberId)) }

// ─── Project Materials ────────────────────────────────────────────
export async function getProjectMaterials(projectId: string): Promise<ProjectMaterial[]> {
  try { const q = query(collection(db, 'projects', projectId, 'materials'), orderBy('sortOrder')); const s = await getDocs(q); return s.docs.map((d) => ({ id: d.id, projectId, ...d.data() } as ProjectMaterial)) } catch { return [] }
}
export async function addProjectMaterial(projectId: string, data: Omit<ProjectMaterial, 'id' | 'projectId'>) {
  return (await addDoc(collection(db, 'projects', projectId, 'materials'), data)).id
}
export async function updateProjectMaterial(projectId: string, materialId: string, data: Partial<ProjectMaterial>) {
  await updateDoc(doc(db, 'projects', projectId, 'materials', materialId), data)
}
export async function deleteProjectMaterial(projectId: string, materialId: string) {
  await deleteDoc(doc(db, 'projects', projectId, 'materials', materialId))
}

// ─── Material Transactions ────────────────────────────────────────
export async function getMaterialTransactions(projectId: string): Promise<MaterialTransaction[]> {
  try {
    const q = query(collection(db, 'projects', projectId, 'transactions'), orderBy('date', 'desc'))
    const s = await getDocs(q); return s.docs.map((d) => ({ id: d.id, projectId, ...d.data() } as MaterialTransaction))
  } catch { return [] }
}
export async function getMaterialTransactionsByDate(projectId: string, date: string): Promise<MaterialTransaction[]> {
  try {
    const q = query(collection(db, 'projects', projectId, 'transactions'), where('date', '==', date))
    const s = await getDocs(q); return s.docs.map((d) => ({ id: d.id, projectId, ...d.data() } as MaterialTransaction))
  } catch { return [] }
}
export async function addMaterialTransaction(projectId: string, data: Omit<MaterialTransaction, 'id' | 'projectId'>) {
  // Save transaction
  const txnId = (await addDoc(collection(db, 'projects', projectId, 'transactions'), { ...data, createdAt: new Date().toISOString() })).id
  // Update running totals on the material document
  const materialRef = doc(db, 'projects', projectId, 'materials', data.materialId)
  if (data.type === 'inward') {
    await updateDoc(materialRef, { totalInward: increment(data.quantity) })
  } else {
    await updateDoc(materialRef, { totalConsumed: increment(data.quantity) })
  }
  return txnId
}
export async function deleteMaterialTransaction(projectId: string, txnId: string, materialId: string, type: 'inward' | 'consumed', quantity: number) {
  await deleteDoc(doc(db, 'projects', projectId, 'transactions', txnId))
  // Reverse the running total
  const materialRef = doc(db, 'projects', projectId, 'materials', materialId)
  if (type === 'inward') {
    await updateDoc(materialRef, { totalInward: increment(-quantity) })
  } else {
    await updateDoc(materialRef, { totalConsumed: increment(-quantity) })
  }
}

// ─── Daily Reports ────────────────────────────────────────────────
export async function getDailyReports(projectId: string): Promise<DailyReport[]> {
  try {
    const q = query(collection(db, 'projects', projectId, 'dailyReports'), orderBy('date', 'desc'))
    const s = await getDocs(q); return s.docs.map((d) => ({ id: d.id, projectId, ...d.data() } as DailyReport))
  } catch { return [] }
}
export async function getDailyReportByDate(projectId: string, date: string): Promise<DailyReport | null> {
  try {
    const q = query(collection(db, 'projects', projectId, 'dailyReports'), where('date', '==', date))
    const s = await getDocs(q); if (s.empty) return null; const d = s.docs[0]; return { id: d.id, projectId, ...d.data() } as DailyReport
  } catch { return null }
}
export async function addDailyReport(projectId: string, data: Omit<DailyReport, 'id' | 'projectId'>) {
  return (await addDoc(collection(db, 'projects', projectId, 'dailyReports'), { ...data, createdAt: new Date().toISOString() })).id
}
export async function updateDailyReport(projectId: string, reportId: string, data: Partial<DailyReport>) {
  await updateDoc(doc(db, 'projects', projectId, 'dailyReports', reportId), data)
}

// Get all daily reports across all projects for a given date (admin overview)
export async function getAllDailyReportsByDate(date: string): Promise<DailyReport[]> {
  try {
    const q = query(collectionGroup(db, 'dailyReports'), where('date', '==', date))
    const s = await getDocs(q); return s.docs.map((d) => ({ id: d.id, projectId: d.ref.parent.parent?.id ?? '', ...d.data() } as DailyReport))
  } catch { return [] }
}

// ─── Project Expenses ─────────────────────────────────────────────
export async function getProjectExpenses(projectId: string): Promise<ProjectExpense[]> {
  try {
    const q = query(collection(db, 'projects', projectId, 'expenses'), orderBy('date', 'desc'))
    const s = await getDocs(q); return s.docs.map((d) => ({ id: d.id, projectId, ...d.data() } as ProjectExpense))
  } catch { return [] }
}
export async function addProjectExpense(projectId: string, data: Omit<ProjectExpense, 'id' | 'projectId'>) {
  return (await addDoc(collection(db, 'projects', projectId, 'expenses'), { ...data, createdAt: new Date().toISOString() })).id
}
export async function deleteProjectExpense(projectId: string, expenseId: string) {
  await deleteDoc(doc(db, 'projects', projectId, 'expenses', expenseId))
}
// Get all expenses across all projects for profit dashboard
export async function getAllProjectsExpenses(): Promise<ProjectExpense[]> {
  try {
    const s = await getDocs(collectionGroup(db, 'expenses'))
    return s.docs.map((d) => ({ id: d.id, projectId: d.ref.parent.parent?.id ?? '', ...d.data() } as ProjectExpense))
  } catch { return [] }
}

// ─── Project Vendors ──────────────────────────────────────────────
export async function getProjectVendors(projectId: string): Promise<ProjectVendor[]> {
  try { const q = query(collection(db, 'projects', projectId, 'vendors'), orderBy('name')); const s = await getDocs(q); return s.docs.map((d) => ({ id: d.id, projectId, ...d.data() } as ProjectVendor)) } catch { return [] }
}
export async function addProjectVendor(projectId: string, data: Omit<ProjectVendor, 'id' | 'projectId'>) {
  return (await addDoc(collection(db, 'projects', projectId, 'vendors'), { ...data, createdAt: new Date().toISOString() })).id
}
export async function deleteProjectVendor(projectId: string, vendorId: string) {
  await deleteDoc(doc(db, 'projects', projectId, 'vendors', vendorId))
}

// ─── Vendor Orders ────────────────────────────────────────────────
export async function getVendorOrders(projectId: string): Promise<VendorOrder[]> {
  try { const q = query(collection(db, 'projects', projectId, 'vendorOrders'), orderBy('date', 'desc')); const s = await getDocs(q); return s.docs.map((d) => ({ id: d.id, projectId, ...d.data() } as VendorOrder)) } catch { return [] }
}
export async function addVendorOrder(projectId: string, data: Omit<VendorOrder, 'id' | 'projectId'>) {
  return (await addDoc(collection(db, 'projects', projectId, 'vendorOrders'), { ...data, createdAt: new Date().toISOString() })).id
}
export async function updateVendorOrder(projectId: string, orderId: string, data: Partial<VendorOrder>) {
  await updateDoc(doc(db, 'projects', projectId, 'vendorOrders', orderId), data)
}
export async function deleteVendorOrder(projectId: string, orderId: string) {
  await deleteDoc(doc(db, 'projects', projectId, 'vendorOrders', orderId))
}

// Get all vendor orders across all projects (for admin dashboard payables)
export async function getAllVendorOrders(): Promise<VendorOrder[]> {
  try {
    const s = await getDocs(collectionGroup(db, 'vendorOrders'))
    return s.docs.map((d) => ({ id: d.id, projectId: d.ref.parent.parent?.id ?? '', ...d.data() } as VendorOrder))
  } catch { return [] }
}

// ─── Inventory Projects ───────────────────────────────────────────
export async function getAllInventoryProjects(): Promise<InventoryProject[]> {
  try { const q = query(collection(db, 'inventoryProjects'), orderBy('createdAt', 'desc')); const s = await getDocs(q); return s.docs.map((d) => ({ id: d.id, ...d.data() } as InventoryProject)) } catch { return [] }
}
export async function getVisibleInventoryProjects(): Promise<InventoryProject[]> {
  try { const q = query(collection(db, 'inventoryProjects'), where('isVisible', '==', true)); const s = await getDocs(q); return s.docs.map((d) => ({ id: d.id, ...d.data() } as InventoryProject)) } catch { return [] }
}
export async function getInventoryProjectBySlug(slug: string): Promise<InventoryProject | null> {
  try { const q = query(collection(db, 'inventoryProjects'), where('slug', '==', slug)); const s = await getDocs(q); if (s.empty) return null; const d = s.docs[0]; return { id: d.id, ...d.data() } as InventoryProject } catch { return null }
}
export async function addInventoryProject(data: Omit<InventoryProject, 'id'>) {
  return (await addDoc(collection(db, 'inventoryProjects'), { ...data, createdAt: new Date().toISOString() })).id
}
export async function updateInventoryProject(id: string, data: Partial<InventoryProject>) {
  await updateDoc(doc(db, 'inventoryProjects', id), data)
}
export async function deleteInventoryProject(id: string) { await deleteDoc(doc(db, 'inventoryProjects', id)) }

// ─── Inventory Units ──────────────────────────────────────────────
export async function getInventoryUnits(projectId: string): Promise<InventoryUnit[]> {
  try { const q = query(collection(db, 'inventoryProjects', projectId, 'units'), orderBy('sortOrder')); const s = await getDocs(q); return s.docs.map((d) => ({ id: d.id, projectId, ...d.data() } as InventoryUnit)) } catch { return [] }
}
export async function addInventoryUnit(projectId: string, data: Omit<InventoryUnit, 'id' | 'projectId'>) {
  return (await addDoc(collection(db, 'inventoryProjects', projectId, 'units'), data)).id
}
export async function updateInventoryUnit(projectId: string, unitId: string, data: Partial<InventoryUnit>) {
  await updateDoc(doc(db, 'inventoryProjects', projectId, 'units', unitId), data)
}
export async function deleteInventoryUnit(projectId: string, unitId: string) {
  await deleteDoc(doc(db, 'inventoryProjects', projectId, 'units', unitId))
}

// ─── Unit Enquiries ───────────────────────────────────────────────
export async function getAllUnitEnquiries(): Promise<UnitEnquiry[]> {
  try { const q = query(collection(db, 'unitEnquiries'), orderBy('createdAt', 'desc')); const s = await getDocs(q); return s.docs.map((d) => ({ id: d.id, ...d.data() } as UnitEnquiry)) } catch { return [] }
}
export async function getUnitEnquiriesByProject(projectId: string): Promise<UnitEnquiry[]> {
  try { const q = query(collection(db, 'unitEnquiries'), where('projectId', '==', projectId), orderBy('createdAt', 'desc')); const s = await getDocs(q); return s.docs.map((d) => ({ id: d.id, ...d.data() } as UnitEnquiry)) } catch { return [] }
}
export async function addUnitEnquiry(data: Omit<UnitEnquiry, 'id'>) {
  return (await addDoc(collection(db, 'unitEnquiries'), { ...data, createdAt: new Date().toISOString() })).id
}
export async function updateUnitEnquiry(id: string, data: Partial<UnitEnquiry>) {
  await updateDoc(doc(db, 'unitEnquiries', id), data)
}
