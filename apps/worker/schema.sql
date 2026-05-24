CREATE TABLE IF NOT EXISTS search_jobs (
  id TEXT PRIMARY KEY,
  keyword TEXT NOT NULL,
  status TEXT NOT NULL,
  current_step TEXT NOT NULL,
  total_steps INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  completed_at TEXT,
  error_message TEXT,
  source_result_count INTEGER DEFAULT 0,
  allowed_result_count INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS papers (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL,
  rank INTEGER NOT NULL,
  title TEXT NOT NULL,
  authors TEXT NOT NULL,
  year INTEGER NOT NULL,
  journal_name TEXT NOT NULL,
  doi TEXT NOT NULL,
  oa_status TEXT NOT NULL,
  openalex_id TEXT,
  abstract TEXT,
  cited_by_count INTEGER DEFAULT 0,
  crossref_id TEXT,
  publisher TEXT,
  issn TEXT,
  publication_type TEXT,
  published_date TEXT,
  verification_status TEXT,
  verification_reason TEXT,
  oa_pdf_url TEXT,
  oa_landing_page_url TEXT,
  oa_license TEXT,
  oa_host_type TEXT,
  oa_repository TEXT,
  unpaywall_status TEXT,
  unpaywall_reason TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (job_id) REFERENCES search_jobs(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS evaluations (
  id TEXT PRIMARY KEY,
  paper_id TEXT NOT NULL,
  abstract_score REAL NOT NULL,
  relevance_score REAL DEFAULT 0,
  journal_fit_score REAL DEFAULT 0,
  verification_score REAL DEFAULT 0,
  oa_score REAL DEFAULT 0,
  citation_score REAL DEFAULT 0,
  recency_score REAL DEFAULT 0,
  final_score REAL NOT NULL,
  include_status TEXT NOT NULL,
  relevance_reason TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (paper_id) REFERENCES papers(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS agent_traces (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL,
  step_order INTEGER NOT NULL,
  step_id TEXT NOT NULL,
  agent_name TEXT NOT NULL,
  status TEXT NOT NULL,
  summary TEXT NOT NULL,
  detail TEXT,
  input_count INTEGER DEFAULT 0,
  output_count INTEGER DEFAULT 0,
  started_at TEXT NOT NULL,
  completed_at TEXT,
  error_message TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (job_id) REFERENCES search_jobs(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_papers_job_id ON papers(job_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_paper_id ON evaluations(paper_id);
CREATE INDEX IF NOT EXISTS idx_agent_traces_job_id ON agent_traces(job_id);
CREATE INDEX IF NOT EXISTS idx_agent_traces_job_order ON agent_traces(job_id, step_order);
