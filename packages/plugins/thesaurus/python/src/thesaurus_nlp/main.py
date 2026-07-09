from thesaurus_nlp.api.schemas import RankRequest
if __name__ == "__main__":
    from thesaurus_nlp.services.similarity_ranker import SimilarityRanker
    from thesaurus_nlp.services.wordnet_service import WordNetService
    from thesaurus_nlp.services.pipeline import Pipeline
    from thesaurus_nlp.api.worker import Worker
    


    pipeline = Pipeline(WordNetService(), SimilarityRanker())
    # worker = Worker(callback=pipeline.rank)
    # worker.run()
    examples = [
        ("I view this as an unfair depiction of mankind.", "unfair"),
        ("I view this as an unfair depiction of mankind.", "mankind"),
        ("I view this as an unfair depiction of mankind.", "view"),
        ("I view this as an unfair depiction of mankind.", "depiction"),
        ("We sat by the river bank at sunset.", "river"),
        ("We sat by the river bank at sunset.", "bank"),
        ("We sat by the river bank at sunset.", "sunset"),
        ("We sat by the river bank at sunset.", "sat"),
    ]

    for sentence, word in examples:
        print("\n" + "=" * 60)
        print(f"Sentence : {sentence}")
        print(f"Target   : {word}")
        req = RankRequest(id="0", word=word, context=sentence)
        res = pipeline.rank(req)
        for result in res.results:
            print(f"    {result.word:<20}    score={result.score:.3f}   pos={result.pos}")

    while True:
        print("Enter a sentence")
        sentence = input()
        print("Enter a word to find synonyms.")
        word = input()
        if word not in sentence:
            continue
        req = RankRequest(id="0", word=word, context=sentence)
        res = pipeline.rank(req)
        print(res)