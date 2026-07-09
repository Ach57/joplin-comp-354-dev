if __name__ == "__main__":
    from thesaurus_nlp.services.similarity_ranker import NoOpSimilarityRanker
    from thesaurus_nlp.services.wordnet_service import NoOpWordNetService
    from thesaurus_nlp.services.pipeline import Pipeline
    from thesaurus_nlp.api.worker import Worker
    
    

    pipeline = Pipeline(NoOpWordNetService(), NoOpSimilarityRanker())
    worker = Worker(callback=pipeline.rank)
    worker.run()