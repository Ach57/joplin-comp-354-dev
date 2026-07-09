from abc import ABC, abstractmethod

from thesaurus_nlp.api.schemas import RankRequest, RankResponse

class AbstractPipeline(ABC):
	@abstractmethod
	def rank(self, request: RankRequest) -> RankResponse:
		...
