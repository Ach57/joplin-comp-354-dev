from dataclasses import dataclass

@dataclass
class Candidate:
	word: str
	pos: str
	source: str | None = None

@dataclass
class ScoredCandidate(Candidate):
	score: float = 0.0

	@classmethod
	def from_candidate(cls, candidate: Candidate, score: float) -> 'ScoredCandidate':
		return cls(word=candidate.word, pos=candidate.pos, source=candidate.source, score=score)
