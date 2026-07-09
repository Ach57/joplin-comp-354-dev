from thesaurus_nlp.models.entities import Candidate
from thesaurus_nlp.interfaces.providers import AbstractWordNetService

class NoOpWordNetService(AbstractWordNetService):
	"""A no-op implementation of the WordNet service."""

	def get_related_words(self, word: str) -> list[Candidate]:
		return []
