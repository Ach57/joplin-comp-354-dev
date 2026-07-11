def main() -> int:
    import logging

    from thesaurus_nlp.services.similarity_ranker import SimilarityRanker
    from thesaurus_nlp.services.wordnet_service import WordNetService
    from thesaurus_nlp.services.pipeline import Pipeline
    from thesaurus_nlp.api.worker import Worker
    from thesaurus_nlp.config.settings import Config

    config = Config()

    logging.basicConfig(level=config.log_level, handlers=[logging.StreamHandler(), logging.FileHandler(config.project_root / config.log_file)])

    try:
        pipeline = Pipeline(WordNetService(), SimilarityRanker(model_name=config.model_name), min_score=config.min_score)
        worker = Worker(callback=pipeline.rank)
        worker.run()
        return 0

    except Exception:
        logging.exception("An unexpected error occurred")
        return 1

if __name__ == "__main__":
    exit(main())