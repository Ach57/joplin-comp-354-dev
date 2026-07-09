import logging
import re
from typing import ClassVar

import nltk
from nltk import pos_tag, word_tokenize
from nltk.corpus import wordnet as wn

from thesaurus_nlp.models.entities import Candidate
from thesaurus_nlp.interfaces.providers import AbstractWordNetService

logger = logging.getLogger(__name__)

class WordNetService(AbstractWordNetService):
    """Find related-word candidates using NLTK WordNet at runtime."""
    _TREEBANK_TO_WORDNET_POS_MAPPING: ClassVar[dict[str, str]] = {
        "N": wn.NOUN,
        "V": wn.VERB,
        "A": wn.ADJ,
    }

    def __init__(self):
        nltk.download('wordnet')
        nltk.download('averaged_perceptron_tagger_eng')
        nltk.download('punkt_tab')

    @classmethod
    def _get_pos_value(cls, treebank_tag: str) -> str | None:
        return cls._TREEBANK_TO_WORDNET_POS_MAPPING.get(treebank_tag[0])

    @staticmethod
    def _normalize_word(word: str) -> str:
        return re.sub(r"\s+", "_", word.strip().lower())

    @classmethod
    def _get_pos(cls, word: str, context: str | None = None) -> str | None:
        if context is None:
            return None

        tokens = word_tokenize(context)
        tagged = pos_tag(tokens)

        normalized = word.strip().lower()

        for token, treebank_tag in tagged:
            if token.lower() == normalized:
                return cls._get_pos_value(treebank_tag)
        return None

    def get_related_words(self, word: str, context: str | None) -> list[Candidate]:
        normalized = self._normalize_word(word)
        if not normalized:
            return []

        pos = self._get_pos(word, context)
        synsets = wn.synsets(normalized, pos=pos)

        seen: set[str] = set()
        candidates: list[Candidate] = []

        for synset in synsets:
            for lemma in synset.lemmas():
                candidate_word = lemma.name().replace("_", " ")

                if normalized.replace("_", " ") in candidate_word.lower():
                    continue

                if candidate_word not in seen:
                    seen.add(candidate_word)
                    candidates.append(
                        Candidate(
                            word=candidate_word,
                            pos=synset.pos(),
                            source="nltk-wordnet",
                        )
                    )

        return candidates