// TS-Python API contract (NDJSON over stdio)

export interface RankRequest {
	id: string; // UUID — correlates request to response
	word: string;
	context?: string; // surrounding sentence, for MiniLM ranking
	topN?: number; // default 10
}

export interface SynonymEntry {
	word: string;
	score: number; // 0–1
	pos?: string; // 'n' | 'v' | 'a' | 'r'
}

export interface RankResponse {
	id: string;
	results: SynonymEntry[];
	error?: string;
}

export interface PendingRequest {
	resolve: (value: RankResponse)=> void;
	reject: (reason: Error)=> void;
}

// TS-Frontend types

export interface ContentScriptContext {
	postMessage: (message: unknown)=> Promise<unknown>;
}

export interface CodeMirrorCursor {
	line: number;
	ch: number;
}

export interface CodeMirrorEditor {
	getSelection: ()=> string;
	getCursor: (from?: string)=> CodeMirrorCursor;
	getValue: ()=> string;
	replaceRange: (
		replacement: string,
		from: CodeMirrorCursor,
		to: CodeMirrorCursor,
	)=> void;
}

export interface CodeMirrorStatic {
	commands: Record<string, (cm: CodeMirrorEditor)=> void | Promise<void>>;
}

export interface ReplaceRange {
	from: CodeMirrorCursor;
	to: CodeMirrorCursor;
}

export interface SynonymResponse {
	status: string;
	synonyms?: string[];
}

export interface SynonymMessage {
	type: string;
	word: string;
	context: string;
}
