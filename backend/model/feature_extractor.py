# src/feature_extractor.py

import re
import numpy as np
from urllib.parse import urlparse

def extract_features(url):
    parsed = urlparse(url)

    url_length = len(url)
    domain_length = len(parsed.netloc)
    path_length = len(parsed.path)

    dot_count = url.count('.')
    hyphen_count = url.count('-')
    at_count = url.count('@')
    question_count = url.count('?')
    ampersand_count = url.count('&')
    equal_count = url.count('=')

    digit_count = sum(c.isdigit() for c in url)
    digit_ratio = digit_count / url_length if url_length > 0 else 0

    has_ip = 1 if re.match(r"^\d+\.\d+\.\d+\.\d+$", parsed.netloc) else 0

    suspicious_tokens = ['login', 'secure', 'update', 'verify', 'account']
    suspicious_token_count = sum(token in url.lower() for token in suspicious_tokens)

    is_https = 1 if parsed.scheme == "https" else 0

    feature_values = [
        url_length,
        domain_length,
        path_length,
        dot_count,
        hyphen_count,
        at_count,
        question_count,
        ampersand_count,
        equal_count,
        digit_count,
        digit_ratio,
        has_ip,
        suspicious_token_count,
        is_https
    ]

    feature_dict = {
        "url_length": url_length,
        "domain_length": domain_length,
        "path_length": path_length,
        "dot_count": dot_count,
        "hyphen_count": hyphen_count,
        "at_count": at_count,
        "has_https": is_https,
        "has_ip": has_ip,
        "suspicious_token_count": suspicious_token_count
    }

    return feature_values, feature_dict