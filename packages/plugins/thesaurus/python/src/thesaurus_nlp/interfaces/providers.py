from abc import ABC, abstractmethod

from thesaurus_nlp.models.entities import Candidate, ScoredCandidate

class AbstractWordNetService(ABC):
	@abstractmethod
	def get_related_words(self, word: str, context: str | None) -> list[Candidate]:
		...

class AbstractSimilarityRanker(ABC):
	@abstractmethod
	def score_candidates(self, candidates: list[Candidate], word: str, context: str | None) -> list[ScoredCandidate]:
		...
