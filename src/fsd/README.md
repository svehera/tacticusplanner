- # Feature-Sliced Design Architecture Layers
-
- This document outlines the allowed dependencies between the layers in our FSD architecture. For more details, see [FSD Concepts Overview](https://feature-sliced.github.io/documentation/docs/get-started/overview#concepts)

| Layer    | Can use                                    | Can be used by                          |
| -------- | ------------------------------------------ | --------------------------------------- |
| app      | shared, entities, features, widgets, pages | -                                       |
| pages    | shared, entities, features, widgets        | app                                     |
| widgets  | shared, entities, features                 | pages, app                              |
| features | shared, entities                           | widgets, pages, app                     |
| entities | shared                                     | features, widgets, pages, app           |
| shared   | -                                          | entities, features, widgets, pages, app |
