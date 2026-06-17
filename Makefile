tag=snapshot
image=obiba/amber:$(tag)

build:
	docker build -t $(image) .

run:
	docker run -p 3030:3030 \
		-e APP_NAME=${APP_NAME} \
		-e APP_URL=${AMBER_URL} \
		-e APP_SECRET_KEY=${APP_SECRET_KEY} \
		-e APP_SECRET_IV=${APP_SECRET_IV} \
		-e ENCRYPT_DATA=true \
		-e CLIENT_URLS=${CLIENT_URLS} \
		-e MONGODB_URL=mongodb://${MONGO_USER}:${MONGO_PWD}@mongo:27017/amber?authSource=admin \
		-e ADMINISTRATOR_EMAIL=${ADMINISTRATOR_EMAIL} \
		-e ADMINISTRATOR_PWD=${ADMINISTRATOR_PWD} \
		-e AMBER_STUDIO_URL=${AMBER_STUDIO_URL} \
		-e AMBER_COLLECT_URL=${AMBER_COLLECT_URL} \
		-e AMBER_VISIT_URL=${AMBER_VISIT_URL} \
		-e RECAPTCHA_SECRET_KEY=${RECAPTCHA_SECRET_KEY} \
		-e SENDINBLUE_API_KEY=${SENDINBLUE_API_KEY} \
		-e FROM_EMAIL=${FROM_EMAIL} \
		$(image)

push:
	docker push $(image)

clean:
	docker rm $(docker ps -a -q --filter ancestor=$(image)) || true
	docker rmi $(image) || true