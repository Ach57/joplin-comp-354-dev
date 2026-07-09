from thesaurus_nlp.api.schemas import RankRequest, RankResponse, SynonymEntry
from thesaurus_nlp.interfaces.pipeline import AbstractPipeline
from thesaurus_nlp.interfaces.providers import AbstractSimilarityRanker, AbstractWordNetService

class Pipeline(AbstractPipeline):
	def __init__(self, wordnet_service: AbstractWordNetService, similarity_ranker: AbstractSimilarityRanker, min_score: float = 0.0):
		self.wordnet_service = wordnet_service
		self.similarity_ranker = similarity_ranker
		self.min_score = min_score

	def rank(self, request: RankRequest) -> RankResponse:
		candidates = self.wordnet_service.get_related_words(request.word)

		scored_candidates = self.similarity_ranker.score_candidates(candidates, request.word, request.context)
		scored_candidates.sort(key=lambda x: x.score, reverse=True)

		synonyms = [SynonymEntry(word=candidate.word, score=candidate.score, pos=candidate.pos) for candidate in scored_candidates]
		synonyms = synonyms[:request.top_n] if request.top_n is not None else synonyms
		synonyms = [syn for syn in synonyms if syn.score >= self.min_score]

		return RankResponse(id=request.id, results=synonyms)
